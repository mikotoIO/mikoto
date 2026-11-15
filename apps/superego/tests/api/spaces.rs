use reqwest::StatusCode;
use serde_json::json;
use superego::functions::permissions::Permission;

use crate::{fixtures, harness::run};

#[test]
fn create_space_sets_up_owner_channel_and_role() {
    run(|app| async move {
        let owner = fixtures::user().await;
        let space = app
            .post("/spaces")
            .auth(&owner)
            .json(json!({ "name": "Tokiwadai" }))
            .send()
            .await
            .ok();
        assert_eq!(space["name"], "Tokiwadai");
        assert_eq!(space["ownerId"], owner.id.to_string());
        let channels = space["channels"].as_array().unwrap();
        assert_eq!(channels.len(), 1);
        assert_eq!(channels[0]["name"], "general");
        assert_eq!(space["roles"][0]["name"], "@everyone");

        let id = space["id"].as_str().unwrap();
        let mine = app.get("/spaces").auth(&owner).send().await.ok();
        assert!(mine.as_array().unwrap().iter().any(|s| s["id"] == id));

        let members = app
            .get(&format!("/spaces/{id}/members"))
            .auth(&owner)
            .send()
            .await
            .ok();
        assert_eq!(members.as_array().unwrap().len(), 1);
        assert_eq!(members[0]["userId"], owner.id.to_string());
    });
}

#[test]
fn create_space_validates_accent() {
    run(|app| async move {
        let owner = fixtures::user().await;
        app.post("/spaces")
            .auth(&owner)
            .json(json!({ "name": "x", "accent": "red" }))
            .send()
            .await
            .expect(StatusCode::BAD_REQUEST);
        let space = app
            .post("/spaces")
            .auth(&owner)
            .json(json!({ "name": "x", "accent": "#AABBCC" }))
            .send()
            .await
            .ok();
        assert_eq!(space["accent"], "#AABBCC");
    });
}

#[test]
fn non_members_cannot_see_a_space() {
    run(|app| async move {
        let space = fixtures::space(&fixtures::user().await).await;
        let outsider = fixtures::user().await;

        app.get(&space.path(""))
            .auth(&outsider)
            .send()
            .await
            .expect(StatusCode::UNAUTHORIZED);
        app.get(&space.path("/channels"))
            .auth(&outsider)
            .send()
            .await
            .expect(StatusCode::UNAUTHORIZED);
        app.get(&space.path("/members"))
            .auth(&outsider)
            .send()
            .await
            .expect(StatusCode::UNAUTHORIZED);

        let mine = app.get("/spaces").auth(&outsider).send().await.ok();
        assert_eq!(mine, json!([]));
    });
}

/// Membership is checked first, so a missing space is indistinguishable
/// from one you aren't in.
#[test]
fn unknown_spaces_look_like_foreign_ones() {
    run(|app| async move {
        let user = fixtures::user().await;
        let missing = app
            .get(&format!("/spaces/{}", uuid::Uuid::new_v4()))
            .auth(&user)
            .send()
            .await
            .expect(StatusCode::UNAUTHORIZED);
        let space = fixtures::space(&fixtures::user().await).await;
        let foreign = app
            .get(&space.path(""))
            .auth(&user)
            .send()
            .await
            .expect(StatusCode::UNAUTHORIZED);
        assert_eq!(missing, foreign);
    });
}

#[test]
fn updating_a_space_requires_manage_space() {
    run(|app| async move {
        let space = fixtures::space(&fixtures::user().await).await;
        let update = |name: &str| space_patch(&app, &space, name);

        let member = fixtures::member(&space).await;
        update("nope")
            .auth(&member)
            .send()
            .await
            .expect(StatusCode::FORBIDDEN);

        let manager = fixtures::member_with(&space, Permission::MANAGE_SPACE).await;
        let updated = update("by manager").auth(&manager).send().await.ok();
        assert_eq!(updated["name"], "by manager");

        let admin = fixtures::member_with(&space, Permission::ADMIN).await;
        update("by admin").auth(&admin).send().await.ok();

        update("by owner").auth(&space.owner).send().await.ok();
    });
}

fn space_patch(
    app: &crate::harness::TestApp,
    space: &fixtures::TestSpace,
    name: &str,
) -> crate::harness::Req {
    app.patch(&space.path("")).json(json!({ "name": name }))
}

#[test]
fn only_the_owner_can_delete_a_space() {
    run(|app| async move {
        let space = fixtures::space(&fixtures::user().await).await;
        let admin = fixtures::member_with(&space, Permission::ADMIN).await;

        app.delete(&space.path(""))
            .auth(&admin)
            .send()
            .await
            .expect(StatusCode::UNAUTHORIZED);
        app.delete(&space.path(""))
            .auth(&space.owner)
            .send()
            .await
            .ok();
        let mine = app.get("/spaces").auth(&space.owner).send().await.ok();
        assert_eq!(mine, json!([]));
        app.get(&space.path("/channels"))
            .auth(&admin)
            .send()
            .await
            .expect(StatusCode::UNAUTHORIZED);
    });
}

#[test]
fn invite_flow() {
    run(|app| async move {
        let space = fixtures::space(&fixtures::user().await).await;

        let member = fixtures::member(&space).await;
        app.post(&space.path("/invites"))
            .auth(&member)
            .json(json!({}))
            .send()
            .await
            .expect(StatusCode::FORBIDDEN);

        let moderator = fixtures::member_with(&space, Permission::MODERATOR).await;
        let invite = app
            .post(&space.path("/invites"))
            .auth(&moderator)
            .json(json!({}))
            .send()
            .await
            .ok();
        let code = invite["id"].as_str().unwrap();

        // anyone with the code can preview the space
        let preview = app.get(&format!("/spaces/join/{code}")).send().await.ok();
        assert_eq!(preview["id"], space.id.to_string());

        let newcomer = fixtures::user().await;
        app.post(&format!("/spaces/join/{code}"))
            .auth(&newcomer)
            .send()
            .await
            .ok();
        app.get(&space.path("")).auth(&newcomer).send().await.ok();

        let invites = app
            .get(&space.path("/invites"))
            .auth(&moderator)
            .send()
            .await
            .ok();
        assert!(invites.as_array().unwrap().iter().any(|i| i["id"] == code));

        app.delete(&space.path(&format!("/invites/{code}")))
            .auth(&moderator)
            .send()
            .await
            .ok();
        app.get(&format!("/spaces/join/{code}"))
            .send()
            .await
            .expect(StatusCode::NOT_FOUND);
    });
}

#[test]
fn invites_from_another_space_cannot_be_deleted() {
    run(|app| async move {
        let owner = fixtures::user().await;
        let a = fixtures::space(&owner).await;
        let b = fixtures::space(&owner).await;
        let invite = app
            .post(&b.path("/invites"))
            .auth(&owner)
            .json(json!({}))
            .send()
            .await
            .ok();
        let code = invite["id"].as_str().unwrap();

        app.delete(&a.path(&format!("/invites/{code}")))
            .auth(&owner)
            .send()
            .await
            .expect(StatusCode::NOT_FOUND);
        app.get(&format!("/spaces/join/{code}")).send().await.ok();
    });
}

#[test]
fn leaving_a_space_removes_access() {
    run(|app| async move {
        let space = fixtures::space(&fixtures::user().await).await;
        let member = fixtures::member(&space).await;

        app.delete(&space.path("/leave"))
            .auth(&member)
            .send()
            .await
            .ok();
        app.get(&space.path(""))
            .auth(&member)
            .send()
            .await
            .expect(StatusCode::UNAUTHORIZED);
    });
}

#[test]
fn notification_preferences() {
    run(|app| async move {
        let space = fixtures::space(&fixtures::user().await).await;
        let member = fixtures::member(&space).await;
        let path = space.path("/notification-preference");

        let pref = app
            .post(&path)
            .auth(&member)
            .json(json!({ "level": "MENTIONS" }))
            .send()
            .await
            .ok();
        assert_eq!(pref["level"], "MENTIONS");
        let pref = app.get(&path).auth(&member).send().await.ok();
        assert_eq!(pref["level"], "MENTIONS");

        let all = app
            .get("/spaces/notification-preferences")
            .auth(&member)
            .send()
            .await
            .ok();
        assert_eq!(all.as_array().unwrap().len(), 1);

        let outsider = fixtures::user().await;
        let res = app
            .post(&path)
            .auth(&outsider)
            .json(json!({ "level": "NOTHING" }))
            .send()
            .await;
        assert!(res.status.is_client_error(), "{res:?}");
    });
}
