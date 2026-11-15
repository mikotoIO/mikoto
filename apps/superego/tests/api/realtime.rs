//! WebSocket: authentication, heartbeats and event fan-out over Redis.

use serde_json::json;

use crate::{fixtures, harness::run, ws::Ws};

#[test]
fn authenticates_with_the_first_message() {
    run(|app| async move {
        let user = fixtures::user().await;
        Ws::connect(&app, &user).await;
    });
}

#[test]
fn rejects_bad_tokens() {
    run(|app| async move {
        let mut ws = Ws::open(&app, "garbage").await;
        assert!(ws.closes_without_ready().await);
    });
}

#[test]
fn answers_pings() {
    run(|app| async move {
        let user = fixtures::user().await;
        let mut ws = Ws::connect(&app, &user).await;
        ws.send("ping", json!({ "message": "marco" })).await;
        let pong = ws.expect("pong").await;
        assert_eq!(pong["message"], "marco");
    });
}

#[test]
fn space_messages_reach_members_only() {
    run(|app| async move {
        let space = fixtures::space(&fixtures::user().await).await;
        let member = fixtures::member(&space).await;
        let outsider = fixtures::user().await;
        let mut member_ws = Ws::connect(&app, &member).await;
        let mut outsider_ws = Ws::connect(&app, &outsider).await;

        app.post(&space.messages(space.general))
            .auth(&space.owner)
            .json(json!({ "content": "news" }))
            .send()
            .await
            .ok();

        let event = member_ws.expect("messages.onCreate").await;
        assert_eq!(event["content"], "news");
        assert_eq!(event["channelId"], space.general.to_string());
        outsider_ws.expect_none("messages.onCreate").await;
    });
}

#[test]
fn edits_and_deletes_are_broadcast() {
    run(|app| async move {
        let space = fixtures::space(&fixtures::user().await).await;
        let mut ws = Ws::connect(&app, &space.owner).await;
        let id = fixtures::message(space.general, &space.owner, "v1").await;
        let path = format!("{}/{id}", space.messages(space.general));

        app.patch(&path)
            .auth(&space.owner)
            .json(json!({ "content": "v2" }))
            .send()
            .await
            .ok();
        assert_eq!(ws.expect("messages.onUpdate").await["content"], "v2");

        app.delete(&path).auth(&space.owner).send().await.ok();
        let deleted = ws.expect("messages.onDelete").await;
        assert_eq!(deleted["messageId"], id.to_string());
    });
}

/// Joining a space subscribes an already-open socket to it.
#[test]
fn joining_subscribes_open_sockets() {
    run(|app| async move {
        let space = fixtures::space(&fixtures::user().await).await;
        let newcomer = fixtures::user().await;
        let mut ws = Ws::connect(&app, &newcomer).await;

        let invite = app
            .post(&space.path("/invites"))
            .auth(&space.owner)
            .json(json!({}))
            .send()
            .await
            .ok();
        app.post(&format!("/spaces/join/{}", invite["id"].as_str().unwrap()))
            .auth(&newcomer)
            .send()
            .await
            .ok();
        let joined = ws.expect("spaces.onCreate").await;
        assert_eq!(joined["id"], space.id.to_string());

        app.post(&space.messages(space.general))
            .auth(&space.owner)
            .json(json!({ "content": "welcome" }))
            .send()
            .await
            .ok();
        assert_eq!(ws.expect("messages.onCreate").await["content"], "welcome");
    });
}

/// Leaving unsubscribes: no more events from that space.
#[test]
fn leaving_unsubscribes_open_sockets() {
    run(|app| async move {
        let space = fixtures::space(&fixtures::user().await).await;
        let member = fixtures::member(&space).await;
        let mut ws = Ws::connect(&app, &member).await;

        app.delete(&space.path("/leave"))
            .auth(&member)
            .send()
            .await
            .ok();
        ws.expect("spaces.onDelete").await;

        app.post(&space.messages(space.general))
            .auth(&space.owner)
            .json(json!({ "content": "after you left" }))
            .send()
            .await
            .ok();
        ws.expect_none("messages.onCreate").await;
    });
}

#[test]
fn typing_indicators_reach_the_space() {
    run(|app| async move {
        let space = fixtures::space(&fixtures::user().await).await;
        let member = fixtures::member(&space).await;
        let mut typer = Ws::connect(&app, &space.owner).await;
        let mut watcher = Ws::connect(&app, &member).await;

        typer
            .send(
                "typing.start",
                json!({ "channelId": space.general.to_string() }),
            )
            .await;
        let update = watcher.expect("typing.onUpdate").await;
        assert_eq!(update["userId"], space.owner.id.to_string());
        assert_eq!(update["channelId"], space.general.to_string());
    });
}

/// Regression: the socket used to take a fresh Redis receiver per message,
/// dropping events published while the previous one was being forwarded.
#[test]
fn bursts_of_events_are_all_delivered() {
    run(|app| async move {
        let user = fixtures::user().await;
        let mut ws = Ws::connect(&app, &user).await;
        // Publish concurrently so several land in Redis back-to-back. Stay
        // under fred's broadcast capacity (32), past which the socket closes.
        const BURST: u32 = 25;
        let channel = format!("user:{}", user.id);
        let publishes = (0..BURST).map(|i| {
            superego::functions::pubsub::emit_event(
                "pong",
                json!({ "message": i.to_string() }),
                &channel,
            )
        });
        for result in futures_util::future::join_all(publishes).await {
            result.unwrap();
        }
        let mut received: Vec<String> = Vec::new();
        for _ in 0..BURST {
            received.push(ws.expect("pong").await["message"].as_str().unwrap().into());
        }
        received.sort_by_key(|s| s.parse::<u32>().unwrap());
        let expected: Vec<String> = (0..BURST).map(|i| i.to_string()).collect();
        assert_eq!(received, expected);
    });
}
