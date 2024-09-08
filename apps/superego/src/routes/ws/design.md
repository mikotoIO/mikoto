# Rust Websocket API High Level Design

## Events (Server -> Client)

```rs
// 1. somewhere in server code, an event is emitted to a number of channels
// (sent to the message queue)
// it all happens as serde-(de)serializable types
sink.send("foo_evt", Foo { bar: 42 }, "mychannel:123").await?;

// 2. take it out of the message queue, deserialize it, and run it through a validator
// to see if the message can pass through (authorization, etc)
sink.register::<Foo>("foo_evt", |foo, state| async move {
    // do something with foo
    Ok(())
});
```
