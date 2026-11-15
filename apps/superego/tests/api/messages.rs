use reqwest::StatusCode;
use serde_json::json;
use superego::functions::permissions::Permission;

use crate::{fixtures, harness::run};

#[test]
fn send_and_list_messages() {
    run(|app| async move {
        let space = fixtures::space(&fixtures::user().await).await;
        let member = fixtures::member(&space).await;
        let path = space.messages(space.general);

        let sent = app
            .post(&path)
            .auth(&member)
            .json(json!({ "content": "hello" }))
            .send()
            .await
            .ok();
        assert_eq!(sent["content"], "hello");
        assert_eq!(sent["authorId"], member.id.to_string());
        assert_eq!(sent["author"]["name"], member.name);

        let list = app.get(&path).auth(&space.owner).send().await.ok();
        assert_eq!(list.as_array().unwrap().len(), 1);
        assert_eq!(list[0]["id"], sent["id"]);

        let one = app
            .get(&format!("{path}/{}", sent["id"].as_str().unwrap()))
            .auth(&space.owner)
            .send()
            .await
            .ok();
        assert_eq!(one["content"], "hello");
    });
}

#[test]
fn sending_bumps_channel_activity() {
    run(|app| async move {
        let space = fixtures::space(&fixtures::user().await).await;
        let channel_path = space.path(&format!("/channels/{}", space.general));
        let before = app.get(&channel_path).auth(&space.owner).send().await.ok();

        let sent = app
            .post(&space.messages(space.general))
            .auth(&space.owner)
            .json(json!({ "content": "bump" }))
            .send()
            .await
            .ok();
        let after = app.get(&channel_path).auth(&space.owner).send().await.ok();
        // a fresh space's #general has no activity yet
        assert!(before["lastUpdated"].is_null());
        // what the create response says is exactly what was stored
        assert_eq!(after["lastUpdated"], sent["timestamp"]);
        let listed = app
            .get(&space.messages(space.general))
            .auth(&space.owner)
            .send()
            .await
            .ok();
        assert_eq!(listed[0]["timestamp"], sent["timestamp"]);
    });
}

#[test]
fn pagination_walks_backwards_through_history() {
    run(|app| async move {
        let space = fixtures::space(&fixtures::user().await).await;
        for i in 0..5 {
            app.post(&space.messages(space.general))
                .auth(&space.owner)
                .json(json!({ "content": format!("m{i}") }))
                .send()
                .await
                .ok();
        }
        let path = space.messages(space.general);
        let contents = |v: &serde_json::Value| -> Vec<String> {
            v.as_array()
                .unwrap()
                .iter()
                .map(|m| m["content"].as_str().unwrap().to_string())
                .collect()
        };

        let all = app.get(&path).auth(&space.owner).send().await.ok();
        assert_eq!(contents(&all), ["m0", "m1", "m2", "m3", "m4"]);

        let latest = app
            .get(&format!("{path}?limit=2"))
            .auth(&space.owner)
            .send()
            .await
            .ok();
        assert_eq!(contents(&latest), ["m3", "m4"]);

        let cursor = latest[0]["id"].as_str().unwrap();
        let older = app
            .get(&format!("{path}?limit=2&cursor={cursor}"))
            .auth(&space.owner)
            .send()
            .await
            .ok();
        assert_eq!(contents(&older), ["m1", "m2"]);
    });
}

#[test]
fn non_members_cannot_read_or_post() {
    run(|app| async move {
        let space = fixtures::space(&fixtures::user().await).await;
        let outsider = fixtures::user().await;
        let path = space.messages(space.general);
        app.get(&path)
            .auth(&outsider)
            .send()
            .await
            .expect(StatusCode::UNAUTHORIZED);
        app.post(&path)
            .auth(&outsider)
            .json(json!({ "content": "spam" }))
            .send()
            .await
            .expect(StatusCode::UNAUTHORIZED);
    });
}

#[test]
fn messages_are_scoped_to_their_space() {
    run(|app| async move {
        let attacker = fixtures::user().await;
        let own = fixtures::space(&attacker).await;
        let victim = fixtures::space(&fixtures::user().await).await;
        let secret = fixtures::message(victim.general, &victim.owner, "secret").await;

        // their channel through our space
        app.get(&own.messages(victim.general))
            .auth(&attacker)
            .send()
            .await
            .expect(StatusCode::NOT_FOUND);
        app.post(&own.messages(victim.general))
            .auth(&attacker)
            .json(json!({ "content": "injected" }))
            .send()
            .await
            .expect(StatusCode::NOT_FOUND);
        // their message through our channel
        app.get(&format!("{}/{secret}", own.messages(own.general)))
            .auth(&attacker)
            .send()
            .await
            .expect(StatusCode::NOT_FOUND);
        app.delete(&format!("{}/{secret}", own.messages(own.general)))
            .auth(&attacker)
            .send()
            .await
            .expect(StatusCode::NOT_FOUND);
    });
}

#[test]
fn only_the_author_can_edit() {
    run(|app| async move {
        let space = fixtures::space(&fixtures::user().await).await;
        let author = fixtures::member(&space).await;
        let id = fixtures::message(space.general, &author, "original").await;
        let path = format!("{}/{id}", space.messages(space.general));

        // not even the owner
        app.patch(&path)
            .auth(&space.owner)
            .json(json!({ "content": "rewritten" }))
            .send()
            .await
            .expect(StatusCode::FORBIDDEN);

        let edited = app
            .patch(&path)
            .auth(&author)
            .json(json!({ "content": "fixed typo" }))
            .send()
            .await
            .ok();
        assert_eq!(edited["content"], "fixed typo");
        assert!(edited["editedTimestamp"].is_string());
    });
}

#[test]
fn who_can_delete_a_message() {
    run(|app| async move {
        let space = fixtures::space(&fixtures::user().await).await;
        let author = fixtures::member(&space).await;
        let bystander = fixtures::member(&space).await;
        let path = |id: uuid::Uuid| format!("{}/{id}", space.messages(space.general));

        // the author
        let id = fixtures::message(space.general, &author, "mine").await;
        app.delete(&path(id)).auth(&author).send().await.ok();
        app.get(&path(id))
            .auth(&author)
            .send()
            .await
            .expect(StatusCode::NOT_FOUND);

        // not another member
        let id = fixtures::message(space.general, &author, "theirs").await;
        app.delete(&path(id))
            .auth(&bystander)
            .send()
            .await
            .expect(StatusCode::FORBIDDEN);

        // holders of MANAGE_MESSAGES, MODERATOR or ADMIN, and the owner
        for perms in [
            Permission::MANAGE_MESSAGES,
            Permission::MODERATOR,
            Permission::ADMIN,
        ] {
            let moderator = fixtures::member_with(&space, perms).await;
            let id = fixtures::message(space.general, &author, "bad").await;
            app.delete(&path(id)).auth(&moderator).send().await.ok();
        }
        let id = fixtures::message(space.general, &author, "bad").await;
        app.delete(&path(id)).auth(&space.owner).send().await.ok();

        // an unrelated permission isn't enough
        let other = fixtures::member_with(&space, Permission::MANAGE_CHANNELS).await;
        let id = fixtures::message(space.general, &author, "kept").await;
        app.delete(&path(id))
            .auth(&other)
            .send()
            .await
            .expect(StatusCode::FORBIDDEN);
    });
}
