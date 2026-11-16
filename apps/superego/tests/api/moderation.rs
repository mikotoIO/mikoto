//! Roles, role assignment, kicks and bans.

use reqwest::StatusCode;
use serde_json::{json, Value};
use superego::functions::permissions::{Permission, PermissionSet};

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
        assert_eq!(role["permissions"], json!([]));
        let path = space.path(&format!("/roles/{}", role["id"].as_str().unwrap()));

        let updated = app
            .patch(&path)
            .auth(&manager)
            .json(json!({
                "name": "Helpers",
                "color": "#00ff00",
                "permissions": ["manage_roles"],
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
            .json(
                json!({ "name": "x", "color": null, "permissions": ["superuser"], "position": 0 }),
            )
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

        // (and may only hand out permissions they hold themselves)
        let assigner = fixtures::member_with(
            &space,
            Permission::ASSIGN_ROLES | Permission::MANAGE_CHANNELS,
        )
        .await;
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

#[test]
fn the_owner_cannot_be_kicked_or_banned() {
    run(|app| async move {
        let space = fixtures::space(&fixtures::user().await).await;
        let admin = fixtures::member_with(&space, Permission::ADMIN).await;

        app.delete(&space.path(&format!("/members/{}", space.owner.id)))
            .auth(&admin)
            .send()
            .await
            .expect(StatusCode::FORBIDDEN);
        app.post(&space.path("/bans"))
            .auth(&admin)
            .json(json!({ "userId": space.owner.id }))
            .send()
            .await
            .expect(StatusCode::FORBIDDEN);
        // still in charge
        app.patch(&space.path(""))
            .auth(&space.owner)
            .json(json!({ "name": "mine" }))
            .send()
            .await
            .ok();
    });
}

fn role_patch(permissions: Permission) -> Value {
    json!({
        "name": "Role",
        "color": null,
        "permissions": PermissionSet::from(permissions).to_names(),
        "position": 0,
    })
}

/// A role manager can't mint permissions they don't have.
#[test]
fn role_managers_cannot_escalate() {
    run(|app| async move {
        let space = fixtures::space(&fixtures::user().await).await;
        let manager = fixtures::member_with(
            &space,
            Permission::MANAGE_ROLES | Permission::MANAGE_CHANNELS,
        )
        .await;
        let role = create_role(&app, &space, &manager).await;
        let path = space.path(&format!("/roles/{}", role["id"].as_str().unwrap()));

        for forbidden in [
            Permission::ADMIN,
            Permission::BAN,
            Permission::MANAGE_CHANNELS | Permission::MANAGE_SPACE,
        ] {
            app.patch(&path)
                .auth(&manager)
                .json(role_patch(forbidden))
                .send()
                .await
                .expect(StatusCode::FORBIDDEN);
        }
        app.patch(&path)
            .auth(&manager)
            .json(role_patch(Permission::MANAGE_CHANNELS))
            .send()
            .await
            .ok();

        // nor touch roles above them
        let admin_role = fixtures::role(&space, Permission::ADMIN).await;
        let admin_path = space.path(&format!("/roles/{admin_role}"));
        app.patch(&admin_path)
            .auth(&manager)
            .json(role_patch(Permission::NONE))
            .send()
            .await
            .expect(StatusCode::FORBIDDEN);
        app.delete(&admin_path)
            .auth(&manager)
            .send()
            .await
            .expect(StatusCode::FORBIDDEN);

        // the owner can do all of it
        app.patch(&path)
            .auth(&space.owner)
            .json(role_patch(Permission::ADMIN))
            .send()
            .await
            .ok();
    });
}

#[test]
fn role_permissions_are_validated() {
    run(|app| async move {
        let space = fixtures::space(&fixtures::user().await).await;
        let role = create_role(&app, &space, &space.owner).await;
        let path = space.path(&format!("/roles/{}", role["id"].as_str().unwrap()));
        let too_many: Vec<String> = (0..1000).map(|i| format!("x:{i}")).collect();
        for bad in [
            json!(["lots"]),
            json!(["Ban"]),
            json!(["ban", ""]),
            json!(["polls:"]),
            json!(["Polls:create"]),
            json!(too_many),
        ] {
            app.patch(&path)
                .auth(&space.owner)
                .json(json!({ "name": "x", "color": null, "permissions": bad, "position": 0 }))
                .send()
                .await
                .expect(StatusCode::BAD_REQUEST);
        }

        // stored deduplicated, built-ins first in canonical order, then
        // custom permissions sorted
        let role = app
            .patch(&path)
            .auth(&space.owner)
            .json(json!({
                "name": "x",
                "color": null,
                "permissions": ["polls:create", "ban", "a:b", "superuser", "ban"],
                "position": 0,
            }))
            .send()
            .await
            .ok();
        assert_eq!(
            role["permissions"],
            json!(["superuser", "ban", "a:b", "polls:create"])
        );
    });
}

/// Custom (extension) permissions follow the same rule as built-ins: you can
/// only hand out the ones you hold.
#[test]
fn custom_permissions_cannot_be_escalated() {
    run(|app| async move {
        let space = fixtures::space(&fixtures::user().await).await;
        let manager = fixtures::member_with(&space, Permission::MANAGE_ROLES).await;
        let role = create_role(&app, &space, &manager).await;
        let path = space.path(&format!("/roles/{}", role["id"].as_str().unwrap()));
        let patch = |perms: Value| json!({ "name": "x", "color": null, "permissions": perms, "position": 0 });

        app.patch(&path)
            .auth(&manager)
            .json(patch(json!(["polls:create"])))
            .send()
            .await
            .expect(StatusCode::FORBIDDEN);

        // the owner can hand out any custom permission, and then a role
        // manager holding it can too
        let polls = fixtures::role_named(&space, &["manage_roles", "polls:create"]).await;
        let pollster = fixtures::member_with_roles(&space, &[polls]).await;
        app.patch(&path)
            .auth(&space.owner)
            .json(patch(json!(["polls:close"])))
            .send()
            .await
            .ok();
        // they'd take away polls:close, which they don't hold
        app.patch(&path)
            .auth(&pollster)
            .json(patch(json!(["polls:create"])))
            .send()
            .await
            .expect(StatusCode::FORBIDDEN);
        let other = create_role(&app, &space, &pollster).await;
        let other_path = space.path(&format!("/roles/{}", other["id"].as_str().unwrap()));
        let updated = app
            .patch(&other_path)
            .auth(&pollster)
            .json(patch(json!(["polls:create"])))
            .send()
            .await
            .ok();
        assert_eq!(updated["permissions"], json!(["polls:create"]));
    });
}

/// Assigning a role hands out its permissions, so the same rule applies.
#[test]
fn role_assigners_cannot_escalate() {
    run(|app| async move {
        let space = fixtures::space(&fixtures::user().await).await;
        let assigner = fixtures::member_with(&space, Permission::ASSIGN_ROLES).await;
        let admin_role = fixtures::role(&space, Permission::ADMIN).await;
        let plain_role = fixtures::role(&space, Permission::NONE).await;
        let grant = |user: &TestUser, role: uuid::Uuid| {
            app.post(&space.path(&format!("/members/{}/roles/{role}", user.id)))
        };

        grant(&assigner, admin_role)
            .auth(&assigner)
            .send()
            .await
            .expect(StatusCode::FORBIDDEN);
        let member = fixtures::member(&space).await;
        grant(&member, plain_role).auth(&assigner).send().await.ok();

        // and can't strip a role they couldn't grant
        let admin = fixtures::member(&space).await;
        grant(&admin, admin_role)
            .auth(&space.owner)
            .send()
            .await
            .ok();
        app.delete(&space.path(&format!("/members/{}/roles/{admin_role}", admin.id)))
            .auth(&assigner)
            .send()
            .await
            .expect(StatusCode::FORBIDDEN);
    });
}
