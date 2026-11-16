use reqwest::StatusCode;
use serde_json::json;

use crate::{emojis::create_emoji, fixtures, harness::run, relations::befriend, ws::Ws};

#[test]
fn react_and_unreact() {
    run(|app| async move {
        let space = fixtures::space(&fixtures::user().await).await;
        let member = fixtures::member(&space).await;
        let msg = fixtures::message(space.general, &space.owner, "react to me").await;
        let messages = space.messages(space.general);
        let reactions = format!("{messages}/{msg}/reactions");

        app.put(&format!("{reactions}/+1"))
            .auth(&member)
            .send()
            .await
            .ok();
        app.put(&format!("{reactions}/+1"))
            .auth(&space.owner)
            .send()
            .await
            .ok();
        app.put(&format!("{reactions}/heart"))
            .auth(&member)
            .send()
            .await
            .ok();
        // reacting twice is a no-op
        app.put(&format!("{reactions}/+1"))
            .auth(&member)
            .send()
            .await
            .ok();

        let got = app
            .get(&format!("{messages}/{msg}"))
            .auth(&member)
            .send()
            .await
            .ok();
        let r = &got["reactions"];
        assert_eq!(r.as_array().unwrap().len(), 2);
        assert_eq!(r[0]["emoji"], "+1");
        assert_eq!(r[0]["count"], 2);
        assert!(r[0]["emojiId"].is_null());
        assert_eq!(
            r[0]["userIds"],
            json!([member.id.to_string(), space.owner.id.to_string()])
        );
        assert_eq!(r[1]["emoji"], "heart");
        assert_eq!(r[1]["count"], 1);

        app.delete(&format!("{reactions}/+1"))
            .auth(&member)
            .send()
            .await
            .ok();
        app.delete(&format!("{reactions}/heart"))
            .auth(&member)
            .send()
            .await
            .ok();
        // listing includes reactions too
        let list = app.get(&messages).auth(&member).send().await.ok();
        assert_eq!(
            list[0]["reactions"],
            json!([{
                "emoji": "+1",
                "emojiId": null,
                "count": 1,
                "userIds": [space.owner.id.to_string()],
            }])
        );
    });
}

#[test]
fn custom_emoji_reactions() {
    run(|app| async move {
        let owner = fixtures::user().await;
        let space = fixtures::space(&owner).await;
        let other_space = fixtures::space(&owner).await;
        let msg = fixtures::message(space.general, &owner, "hi").await;
        let reactions = format!("{}/{msg}/reactions", space.messages(space.general));

        let emoji = create_emoji(&app, &space, "blob").await;
        let id = emoji["id"].as_str().unwrap();
        app.put(&format!("{reactions}/{id}"))
            .auth(&owner)
            .send()
            .await
            .ok();
        let got = app
            .get(&format!("{}/{msg}", space.messages(space.general)))
            .auth(&owner)
            .send()
            .await
            .ok();
        assert_eq!(got["reactions"][0]["emoji"], id);
        assert_eq!(got["reactions"][0]["emojiId"], id);

        // an emoji from another space is refused
        let foreign = create_emoji(&app, &other_space, "foreign").await;
        app.put(&format!("{reactions}/{}", foreign["id"].as_str().unwrap()))
            .auth(&owner)
            .send()
            .await
            .expect(StatusCode::NOT_FOUND);

        // deleting the emoji removes its reactions
        app.delete(&space.path(&format!("/emojis/{id}")))
            .auth(&owner)
            .send()
            .await
            .ok();
        let got = app
            .get(&format!("{}/{msg}", space.messages(space.general)))
            .auth(&owner)
            .send()
            .await
            .ok();
        assert_eq!(got["reactions"], json!([]));
    });
}

#[test]
fn rejects_bad_emoji_and_outsiders() {
    run(|app| async move {
        let space = fixtures::space(&fixtures::user().await).await;
        let msg = fixtures::message(space.general, &space.owner, "hi").await;
        let reactions = format!("{}/{msg}/reactions", space.messages(space.general));

        app.put(&format!("{reactions}/Not%20Emoji"))
            .auth(&space.owner)
            .send()
            .await
            .expect(StatusCode::BAD_REQUEST);

        let outsider = fixtures::user().await;
        app.put(&format!("{reactions}/+1"))
            .auth(&outsider)
            .send()
            .await
            .expect(StatusCode::UNAUTHORIZED);

        // a message from another channel can't be reached through this one
        let other = fixtures::space(&space.owner).await;
        let foreign = fixtures::message(other.general, &space.owner, "elsewhere").await;
        app.put(&format!(
            "{}/{foreign}/reactions/+1",
            space.messages(space.general)
        ))
        .auth(&space.owner)
        .send()
        .await
        .expect(StatusCode::NOT_FOUND);
    });
}

#[test]
fn caps_distinct_reactions() {
    run(|app| async move {
        let space = fixtures::space(&fixtures::user().await).await;
        let msg = fixtures::message(space.general, &space.owner, "hi").await;
        let reactions = format!("{}/{msg}/reactions", space.messages(space.general));
        for i in 0..20 {
            app.put(&format!("{reactions}/e{i}"))
                .auth(&space.owner)
                .send()
                .await
                .ok();
        }
        app.put(&format!("{reactions}/one_too_many"))
            .auth(&space.owner)
            .send()
            .await
            .expect(StatusCode::BAD_REQUEST);
        // existing emoji can still gain reactors
        let member = fixtures::member(&space).await;
        app.put(&format!("{reactions}/e0"))
            .auth(&member)
            .send()
            .await
            .ok();
    });
}

#[test]
fn reactions_are_broadcast() {
    run(|app| async move {
        let space = fixtures::space(&fixtures::user().await).await;
        let member = fixtures::member(&space).await;
        let msg = fixtures::message(space.general, &space.owner, "hi").await;
        let reactions = format!("{}/{msg}/reactions", space.messages(space.general));
        let mut ws = Ws::connect(&app, &space.owner).await;

        app.put(&format!("{reactions}/tada"))
            .auth(&member)
            .send()
            .await
            .ok();
        let added = ws.expect("messages.onReactionAdd").await;
        assert_eq!(added["messageId"], msg.to_string());
        assert_eq!(added["channelId"], space.general.to_string());
        assert_eq!(added["userId"], member.id.to_string());
        assert_eq!(added["emoji"], "tada");

        // repeating it changes nothing, so nothing is sent
        app.put(&format!("{reactions}/tada"))
            .auth(&member)
            .send()
            .await
            .ok();
        app.delete(&format!("{reactions}/tada"))
            .auth(&member)
            .send()
            .await
            .ok();
        let removed = ws.expect("messages.onReactionRemove").await;
        assert_eq!(removed["emoji"], "tada");
    });
}

#[test]
fn dm_reactions() {
    run(|app| async move {
        let (alice, bob) = (fixtures::user().await, fixtures::user().await);
        befriend(&app, &alice, &bob).await;
        let channel = app
            .post(&format!("/relations/{}/dm", bob.id))
            .auth(&alice)
            .send()
            .await
            .ok();
        let path = format!("/dm/{}/messages", channel["id"].as_str().unwrap());
        let msg = app
            .post(&path)
            .auth(&alice)
            .json(json!({ "content": "hi bob" }))
            .send()
            .await
            .ok();
        let reactions = format!("{path}/{}/reactions", msg["id"].as_str().unwrap());

        let mut alice_ws = Ws::connect(&app, &alice).await;
        app.put(&format!("{reactions}/wave"))
            .auth(&bob)
            .send()
            .await
            .ok();
        assert_eq!(
            alice_ws.expect("messages.onReactionAdd").await["userId"],
            bob.id.to_string()
        );
        let list = app.get(&path).auth(&alice).send().await.ok();
        assert_eq!(list[0]["reactions"][0]["emoji"], "wave");

        // custom emoji don't exist outside spaces
        let space = fixtures::space(&bob).await;
        let emoji = create_emoji(&app, &space, "blob").await;
        app.put(&format!("{reactions}/{}", emoji["id"].as_str().unwrap()))
            .auth(&bob)
            .send()
            .await
            .expect(StatusCode::NOT_FOUND);

        let eve = fixtures::user().await;
        app.put(&format!("{reactions}/wave"))
            .auth(&eve)
            .send()
            .await
            .expect(StatusCode::FORBIDDEN);

        app.delete(&format!("{reactions}/wave"))
            .auth(&bob)
            .send()
            .await
            .ok();
        let list = app.get(&path).auth(&alice).send().await.ok();
        assert_eq!(list[0]["reactions"], json!([]));
    });
}
