//! Friend requests and direct messages.

use reqwest::StatusCode;
use serde_json::json;

use crate::{
    fixtures::{self, TestUser},
    harness::{run, TestApp},
};

async fn befriend(app: &TestApp, a: &TestUser, b: &TestUser) {
    app.post(&format!("/relations/{}/request", b.id))
        .auth(a)
        .send()
        .await
        .ok();
    app.post(&format!("/relations/{}/accept", a.id))
        .auth(b)
        .send()
        .await
        .ok();
}

#[test]
fn friend_request_lifecycle() {
    run(|app| async move {
        let (alice, bob) = (fixtures::user().await, fixtures::user().await);

        let sent = app
            .post(&format!("/relations/{}/request", bob.id))
            .auth(&alice)
            .send()
            .await
            .ok();
        assert_eq!(sent["state"], "OUTGOING_REQUEST");
        let incoming = app
            .get(&format!("/relations/{}", alice.id))
            .auth(&bob)
            .send()
            .await
            .ok();
        assert_eq!(incoming["state"], "INCOMING_REQUEST");

        let accepted = app
            .post(&format!("/relations/{}/accept", alice.id))
            .auth(&bob)
            .send()
            .await
            .ok();
        assert_eq!(accepted["state"], "FRIEND");
        let theirs = app
            .get(&format!("/relations/{}", bob.id))
            .auth(&alice)
            .send()
            .await
            .ok();
        assert_eq!(theirs["state"], "FRIEND");

        let list = app.get("/relations").auth(&alice).send().await.ok();
        assert_eq!(list.as_array().unwrap().len(), 1);
    });
}

#[test]
fn crossing_requests_become_friendship() {
    run(|app| async move {
        let (alice, bob) = (fixtures::user().await, fixtures::user().await);
        app.post(&format!("/relations/{}/request", bob.id))
            .auth(&alice)
            .send()
            .await
            .ok();
        let rel = app
            .post(&format!("/relations/{}/request", alice.id))
            .auth(&bob)
            .send()
            .await
            .ok();
        assert_eq!(rel["state"], "FRIEND");
    });
}

#[test]
fn cannot_befriend_yourself() {
    run(|app| async move {
        let alice = fixtures::user().await;
        app.post(&format!("/relations/{}/request", alice.id))
            .auth(&alice)
            .send()
            .await
            .expect(StatusCode::BAD_REQUEST);
    });
}

#[test]
fn blocked_users_cannot_send_requests() {
    run(|app| async move {
        let (alice, bob) = (fixtures::user().await, fixtures::user().await);
        app.post(&format!("/relations/{}/block", bob.id))
            .auth(&alice)
            .send()
            .await
            .ok();
        app.post(&format!("/relations/{}/request", alice.id))
            .auth(&bob)
            .send()
            .await
            .expect(StatusCode::FORBIDDEN);
    });
}

#[test]
fn direct_messages_between_friends() {
    run(|app| async move {
        let (alice, bob) = (fixtures::user().await, fixtures::user().await);

        // must be friends first
        app.post(&format!("/relations/{}/dm", bob.id))
            .auth(&alice)
            .send()
            .await
            .expect(StatusCode::NOT_FOUND);
        befriend(&app, &alice, &bob).await;

        let channel = app
            .post(&format!("/relations/{}/dm", bob.id))
            .auth(&alice)
            .send()
            .await
            .ok();
        let channel_id = channel["id"].as_str().unwrap().to_string();
        assert!(channel["spaceId"].is_null());

        // both sides get the same channel
        let again = app
            .post(&format!("/relations/{}/dm", alice.id))
            .auth(&bob)
            .send()
            .await
            .ok();
        assert_eq!(again["id"], channel_id.as_str());

        let path = format!("/dm/{channel_id}/messages");
        app.post(&path)
            .auth(&alice)
            .json(json!({ "content": "hi bob" }))
            .send()
            .await
            .ok();
        let msgs = app.get(&path).auth(&bob).send().await.ok();
        assert_eq!(msgs[0]["content"], "hi bob");

        let eve = fixtures::user().await;
        app.get(&path)
            .auth(&eve)
            .send()
            .await
            .expect(StatusCode::FORBIDDEN);
        app.post(&path)
            .auth(&eve)
            .json(json!({ "content": "hi" }))
            .send()
            .await
            .expect(StatusCode::FORBIDDEN);
    });
}

#[test]
fn space_channels_are_not_dm_channels() {
    run(|app| async move {
        let space = fixtures::space(&fixtures::user().await).await;
        let outsider = fixtures::user().await;
        let res = app
            .get(&format!("/dm/{}/messages", space.general))
            .auth(&outsider)
            .send()
            .await;
        assert!(res.status.is_client_error(), "{res:?}");
    });
}
