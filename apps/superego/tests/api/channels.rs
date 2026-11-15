use reqwest::StatusCode;
use serde_json::json;
use superego::functions::permissions::Permission;

use crate::{fixtures, harness::run};

#[test]
fn creating_channels_requires_manage_channels() {
    run(|app| async move {
        let space = fixtures::space(&fixtures::user().await).await;
        let create = |name: &str| {
            app.post(&space.path("/channels"))
                .json(json!({ "name": name }))
        };

        let member = fixtures::member(&space).await;
        create("nope")
            .auth(&member)
            .send()
            .await
            .expect(StatusCode::FORBIDDEN);

        let manager = fixtures::member_with(&space, Permission::MANAGE_CHANNELS).await;
        let channel = create("announcements").auth(&manager).send().await.ok();
        assert_eq!(channel["name"], "announcements");
        assert_eq!(channel["type"], "TEXT");

        // visible to every member
        let list = app
            .get(&space.path("/channels"))
            .auth(&member)
            .send()
            .await
            .ok();
        assert!(list
            .as_array()
            .unwrap()
            .iter()
            .any(|c| c["id"] == channel["id"]));
    });
}

#[test]
fn update_and_delete_channel() {
    run(|app| async move {
        let space = fixtures::space(&fixtures::user().await).await;
        let path = space.path(&format!("/channels/{}", space.general));
        let member = fixtures::member(&space).await;

        app.patch(&path)
            .auth(&member)
            .json(json!({ "name": "hijacked" }))
            .send()
            .await
            .expect(StatusCode::FORBIDDEN);
        let renamed = app
            .patch(&path)
            .auth(&space.owner)
            .json(json!({ "name": "lobby" }))
            .send()
            .await
            .ok();
        assert_eq!(renamed["name"], "lobby");

        app.delete(&path)
            .auth(&member)
            .send()
            .await
            .expect(StatusCode::FORBIDDEN);
        app.delete(&path).auth(&space.owner).send().await.ok();
        app.get(&path)
            .auth(&space.owner)
            .send()
            .await
            .expect(StatusCode::NOT_FOUND);
    });
}

#[test]
fn document_channels_get_a_document() {
    run(|app| async move {
        let space = fixtures::space(&fixtures::user().await).await;
        let channel = app
            .post(&space.path("/channels"))
            .auth(&space.owner)
            .json(json!({ "name": "wiki", "type": "DOCUMENT" }))
            .send()
            .await
            .ok();
        assert_eq!(channel["type"], "DOCUMENT");
        let id = channel["id"].as_str().unwrap();
        let doc = app
            .get(&space.path(&format!("/channels/{id}/documents")))
            .auth(&space.owner)
            .send()
            .await
            .ok();
        assert_eq!(doc["channelId"], id);
    });
}

/// A member of one space must not reach channels of another space by
/// putting their own space id in the URL.
#[test]
fn channels_are_scoped_to_their_space() {
    run(|app| async move {
        let attacker = fixtures::user().await;
        let own = fixtures::space(&attacker).await;
        let victim = fixtures::space(&fixtures::user().await).await;
        let foreign = format!("/channels/{}", victim.general);

        app.get(&own.path(&foreign))
            .auth(&attacker)
            .send()
            .await
            .expect(StatusCode::NOT_FOUND);
        app.patch(&own.path(&foreign))
            .auth(&attacker)
            .json(json!({ "name": "pwned" }))
            .send()
            .await
            .expect(StatusCode::NOT_FOUND);
        app.delete(&own.path(&foreign))
            .auth(&attacker)
            .send()
            .await
            .expect(StatusCode::NOT_FOUND);
    });
}

#[test]
fn unreads_follow_acknowledgements() {
    run(|app| async move {
        let space = fixtures::space(&fixtures::user().await).await;
        let member = fixtures::member(&space).await;

        let unreads = app
            .get(&space.path("/channels/unreads"))
            .auth(&member)
            .send()
            .await
            .ok();
        assert_eq!(unreads, json!([]));

        app.post(&space.path(&format!("/channels/{}/ack", space.general)))
            .auth(&member)
            .send()
            .await
            .ok();
        let unreads = app
            .get(&space.path("/channels/unreads"))
            .auth(&member)
            .send()
            .await
            .ok();
        assert_eq!(unreads.as_array().unwrap().len(), 1);
        assert_eq!(unreads[0]["channelId"], space.general.to_string());

        // acks are per user
        let other = app
            .get(&space.path("/channels/unreads"))
            .auth(&space.owner)
            .send()
            .await
            .ok();
        assert_eq!(other, json!([]));
    });
}
