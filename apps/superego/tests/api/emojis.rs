use reqwest::StatusCode;
use serde_json::{json, Value};
use superego::functions::permissions::Permission;

use crate::{
    fixtures::{self, TestSpace, TestUser},
    harness::{run, TestApp},
    ws::Ws,
};

fn image() -> String {
    format!("emoji/{}.png", fixtures::short_id())
}

pub async fn create_emoji(app: &TestApp, space: &TestSpace, name: &str) -> Value {
    app.post(&space.path("/emojis"))
        .auth(&space.owner)
        .json(json!({ "name": name, "image": image() }))
        .send()
        .await
        .ok()
}

async fn try_create(app: &TestApp, space: &TestSpace, user: &TestUser, body: Value) -> StatusCode {
    app.post(&space.path("/emojis"))
        .auth(user)
        .json(body)
        .send()
        .await
        .status
}

#[test]
fn create_list_rename_delete() {
    run(|app| async move {
        let space = fixtures::space(&fixtures::user().await).await;
        let member = fixtures::member(&space).await;

        let created = create_emoji(&app, &space, "party_parrot").await;
        assert_eq!(created["name"], "party_parrot");
        assert_eq!(created["spaceId"], space.id.to_string());
        assert_eq!(created["creatorId"], space.owner.id.to_string());
        let id = created["id"].as_str().unwrap();

        // any member can see them, both listed and on the space itself
        let list = app
            .get(&space.path("/emojis"))
            .auth(&member)
            .send()
            .await
            .ok();
        assert_eq!(list.as_array().unwrap().len(), 1);
        let got = app.get(&space.path("")).auth(&member).send().await.ok();
        assert_eq!(got["emojis"][0]["id"], id);

        let renamed = app
            .patch(&space.path(&format!("/emojis/{id}")))
            .auth(&space.owner)
            .json(json!({ "name": "parrot" }))
            .send()
            .await
            .ok();
        assert_eq!(renamed["name"], "parrot");
        assert_eq!(renamed["image"], created["image"]);

        app.delete(&space.path(&format!("/emojis/{id}")))
            .auth(&space.owner)
            .send()
            .await
            .ok();
        let list = app
            .get(&space.path("/emojis"))
            .auth(&member)
            .send()
            .await
            .ok();
        assert!(list.as_array().unwrap().is_empty());
    });
}

#[test]
fn managing_needs_manage_emojis() {
    run(|app| async move {
        let space = fixtures::space(&fixtures::user().await).await;
        let member = fixtures::member(&space).await;
        let manager = fixtures::member_with(&space, Permission::MANAGE_EMOJIS).await;
        let outsider = fixtures::user().await;

        let body = || json!({ "name": "blob", "image": image() });
        assert_eq!(
            try_create(&app, &space, &member, body()).await,
            StatusCode::FORBIDDEN
        );
        assert_eq!(
            try_create(&app, &space, &outsider, body()).await,
            StatusCode::UNAUTHORIZED
        );
        assert_eq!(
            try_create(&app, &space, &manager, body()).await,
            StatusCode::OK
        );

        let id = create_emoji(&app, &space, "other").await["id"]
            .as_str()
            .unwrap()
            .to_string();
        let path = space.path(&format!("/emojis/{id}"));
        app.patch(&path)
            .auth(&member)
            .json(json!({ "name": "nope" }))
            .send()
            .await
            .expect(StatusCode::FORBIDDEN);
        app.delete(&path)
            .auth(&member)
            .send()
            .await
            .expect(StatusCode::FORBIDDEN);
        app.delete(&path).auth(&manager).send().await.ok();
    });
}

#[test]
fn rejects_bad_names_images_and_duplicates() {
    run(|app| async move {
        let space = fixtures::space(&fixtures::user().await).await;
        let owner = space.owner.clone();
        for name in ["a", "has space", "dash-ed", ":colon:"] {
            assert_eq!(
                try_create(
                    &app,
                    &space,
                    &owner,
                    json!({ "name": name, "image": image() })
                )
                .await,
                StatusCode::BAD_REQUEST,
                "{name}"
            );
        }
        for img in ["https://example.com/x.png", "avatar/x.png", "emoji/x.svg"] {
            assert_eq!(
                try_create(
                    &app,
                    &space,
                    &owner,
                    json!({ "name": "fine", "image": img })
                )
                .await,
                StatusCode::BAD_REQUEST,
                "{img}"
            );
        }

        create_emoji(&app, &space, "Blob").await;
        // names are unique per space, ignoring case
        assert_eq!(
            try_create(
                &app,
                &space,
                &owner,
                json!({ "name": "blob", "image": image() })
            )
            .await,
            StatusCode::CONFLICT
        );
        let other = create_emoji(&app, &space, "other").await;
        app.patch(&space.path(&format!("/emojis/{}", other["id"].as_str().unwrap())))
            .auth(&owner)
            .json(json!({ "name": "BLOB" }))
            .send()
            .await
            .expect(StatusCode::CONFLICT);

        // ...but another space can reuse the name
        let elsewhere = fixtures::space(&owner).await;
        create_emoji(&app, &elsewhere, "blob").await;
    });
}

#[test]
fn cannot_touch_another_spaces_emoji() {
    run(|app| async move {
        let owner = fixtures::user().await;
        let (a, b) = (fixtures::space(&owner).await, fixtures::space(&owner).await);
        let emoji = create_emoji(&app, &a, "mine").await;
        let path = b.path(&format!("/emojis/{}", emoji["id"].as_str().unwrap()));
        app.patch(&path)
            .auth(&owner)
            .json(json!({ "name": "stolen" }))
            .send()
            .await
            .expect(StatusCode::NOT_FOUND);
        app.delete(&path)
            .auth(&owner)
            .send()
            .await
            .expect(StatusCode::NOT_FOUND);
    });
}

#[test]
fn changes_are_broadcast_to_the_space() {
    run(|app| async move {
        let space = fixtures::space(&fixtures::user().await).await;
        let member = fixtures::member(&space).await;
        let mut ws = Ws::connect(&app, &member).await;

        let emoji = create_emoji(&app, &space, "wave").await;
        assert_eq!(ws.expect("emojis.onCreate").await["name"], "wave");

        let path = space.path(&format!("/emojis/{}", emoji["id"].as_str().unwrap()));
        app.patch(&path)
            .auth(&space.owner)
            .json(json!({ "name": "wave2" }))
            .send()
            .await
            .ok();
        assert_eq!(ws.expect("emojis.onUpdate").await["name"], "wave2");

        app.delete(&path).auth(&space.owner).send().await.ok();
        assert_eq!(ws.expect("emojis.onDelete").await["id"], emoji["id"]);
    });
}
