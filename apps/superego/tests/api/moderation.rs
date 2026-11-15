//! Roles, role assignment, kicks and bans.

use reqwest::StatusCode;
use serde_json::{json, Value};
use superego::functions::permissions::Permission;

use crate::{
    fixtures::{self, TestSpace, TestUser},
    harness::{run, TestApp},
};

async fn create_role(app: &TestApp, space: &TestSpace, by: &TestUser) -> Value {
    app.post(&space.path("/roles"))
        .auth(by)
        .json(json!({ "name": "Helpers" }))
        .send()
        .await
        .ok()
}

#[test]
fn role_crud_requires_manage_roles() {
    run(|app| async move {
        let space = fixtures::space(&fixtures::user().await).await;
        let member = fixtures::member(&space).await;
        app.post(&space.path("/roles"))
            .auth(&member)
            .json(json!({ "name": "x" }))
            .send()
            .await
            .expect(StatusCode::FORBIDDEN);

        let manager = fixtures::member_with(&space, Permission::MANAGE_ROLES).await;
        let role = create_role(&app, &space, &manager).await;
        assert_eq!(role["permissions"], "0");
        let path = space.path(&format!("/roles/{}", role["id"].as_str().unwrap()));

        let updated = app
            .patch(&path)
            .auth(&manager)
            .json(json!({
                "name": "Helpers",
                "color": "#00ff00",
                "permissions": Permission::MANAGE_MESSAGES.bits().to_string(),
                "position": 3,
            }))
            .send()
            .await
            .ok();
        assert_eq!(updated["color"], "#00ff00");
        assert_eq!(updated["position"], 3);

        app.delete(&path)
            .auth(&member)
            .send()
            .await
            .expect(StatusCode::FORBIDDEN);
        app.delete(&path).auth(&manager).send().await.ok();
        let space_json = app.get(&space.path("")).auth(&member).send().await.ok();
        assert!(!space_json["roles"]
            .as_array()
            .unwrap()
            .iter()
            .any(|r| r["id"] == role["id"]));
    });
}

#[test]
fn roles_of_another_space_cannot_be_touched() {
    run(|app| async move {
        let attacker = fixtures::user().await;
        let own = fixtures::space(&attacker).await;
        let victim = fixtures::space(&fixtures::user().await).await;
        let their_role = fixtures::role(&victim, Permission::NONE).await;
        let path = own.path(&format!("/roles/{their_role}"));

        app.patch(&path)
            .auth(&attacker)
            .json(json!({ "name": "x", "color": null, "permissions": "1", "position": 0 }))
            .send()
            .await
            .expect(StatusCode::NOT_FOUND);
        app.delete(&path)
            .auth(&attacker)
            .send()
            .await
            .expect(StatusCode::NOT_FOUND);

        let member = fixtures::member(&own).await;
        app.post(&own.path(&format!("/members/{}/roles/{their_role}", member.id)))
            .auth(&attacker)
            .send()
            .await
            .expect(StatusCode::FORBIDDEN);
    });
}

/// End to end: a role granted through the API changes what the member can do.
#[test]
fn assigning_a_role_grants_its_permissions() {
    run(|app| async move {
        let space = fixtures::space(&fixtures::user().await).await;
        let member = fixtures::member(&space).await;
        let create_channel = || {
            app.post(&space.path("/channels"))
                .auth(&member)
                .json(json!({ "name": "new" }))
        };
        create_channel().send().await.expect(StatusCode::FORBIDDEN);

        let role = fixtures::role(&space, Permission::MANAGE_CHANNELS).await;
        let role_path = space.path(&format!("/members/{}/roles/{role}", member.id));

        // assigning needs ASSIGN_ROLES
        let peer = fixtures::member(&space).await;
        app.post(&role_path)
            .auth(&peer)
            .send()
            .await
            .expect(StatusCode::FORBIDDEN);

        let assigner = fixtures::member_with(&space, Permission::ASSIGN_ROLES).await;
        let updated = app.post(&role_path).auth(&assigner).send().await.ok();
        assert_eq!(updated["roleIds"], json!([role.to_string()]));
        create_channel().send().await.ok();

        app.delete(&role_path).auth(&assigner).send().await.ok();
        create_channel().send().await.expect(StatusCode::FORBIDDEN);
    });
}

#[test]
fn kicking_members() {
    run(|app| async move {
        let space = fixtures::space(&fixtures::user().await).await;
        let target = fixtures::member(&space).await;
        let kick = |user: &TestUser| app.delete(&space.path(&format!("/members/{}", user.id)));

        let member = fixtures::member(&space).await;
        kick(&target)
            .auth(&member)
            .send()
            .await
            .expect(StatusCode::FORBIDDEN);

        let moderator = fixtures::member_with(&space, Permission::BAN).await;
        kick(&moderator)
            .auth(&moderator)
            .send()
            .await
            .expect(StatusCode::FORBIDDEN); // not yourself
        kick(&target).auth(&moderator).send().await.ok();
        app.get(&space.path(""))
            .auth(&target)
            .send()
            .await
            .expect(StatusCode::UNAUTHORIZED);

        // a kick is not a ban: they can come back with an invite
        let invite = app
            .post(&space.path("/invites"))
            .auth(&space.owner)
            .json(json!({}))
            .send()
            .await
            .ok();
        app.post(&format!("/spaces/join/{}", invite["id"].as_str().unwrap()))
            .auth(&target)
            .send()
            .await
            .ok();
    });
}

#[test]
fn banning_removes_and_blocks_rejoining() {
    run(|app| async move {
        let space = fixtures::space(&fixtures::user().await).await;
        let target = fixtures::member(&space).await;
        let invite = app
            .post(&space.path("/invites"))
            .auth(&space.owner)
            .json(json!({}))
            .send()
            .await
            .ok();
        let join = format!("/spaces/join/{}", invite["id"].as_str().unwrap());

        let member = fixtures::member(&space).await;
        app.post(&space.path("/bans"))
            .auth(&member)
            .json(json!({ "userId": target.id }))
            .send()
            .await
            .expect(StatusCode::FORBIDDEN);

        let banner = fixtures::member_with(&space, Permission::BAN).await;
        let ban = app
            .post(&space.path("/bans"))
            .auth(&banner)
            .json(json!({ "userId": target.id, "reason": "spam" }))
            .send()
            .await
            .ok();
        assert_eq!(ban["reason"], "spam");
        assert_eq!(ban["user"]["name"], target.name);

        app.get(&space.path(""))
            .auth(&target)
            .send()
            .await
            .expect(StatusCode::UNAUTHORIZED);
        app.post(&join)
            .auth(&target)
            .send()
            .await
            .expect(StatusCode::FORBIDDEN);

        // banning twice is rejected
        app.post(&space.path("/bans"))
            .auth(&banner)
            .json(json!({ "userId": target.id }))
            .send()
            .await
            .expect(StatusCode::FORBIDDEN);

        let bans = app
            .get(&space.path("/bans"))
            .auth(&banner)
            .send()
            .await
            .ok();
        assert_eq!(bans.as_array().unwrap().len(), 1);
        app.get(&space.path("/bans"))
            .auth(&member)
            .send()
            .await
            .expect(StatusCode::FORBIDDEN);

        app.delete(&space.path(&format!("/bans/{}", target.id)))
            .auth(&banner)
            .send()
            .await
            .ok();
        app.post(&join).auth(&target).send().await.ok();
    });
}

#[test]
fn cannot_ban_yourself() {
    run(|app| async move {
        let space = fixtures::space(&fixtures::user().await).await;
        app.post(&space.path("/bans"))
            .auth(&space.owner)
            .json(json!({ "userId": space.owner.id }))
            .send()
            .await
            .expect(StatusCode::FORBIDDEN);
    });
}
