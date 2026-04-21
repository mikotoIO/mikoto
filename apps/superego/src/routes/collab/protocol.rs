use yrs::encoding::read::Cursor;
use yrs::sync::protocol::{DefaultProtocol, MessageReader};
use yrs::sync::{Awareness, Error as SyncError, Message, Protocol, SyncMessage};
use yrs::updates::decoder::{Decode, DecoderV1};
use yrs::updates::encoder::{Encode, Encoder, EncoderV1};
use yrs::Update;

const PROTOCOL: DefaultProtocol = DefaultProtocol;

pub struct ProcessResult {
    pub replies: Vec<Vec<u8>>,
    pub awareness_broadcast: Vec<Vec<u8>>,
}

pub fn initial_sync(awareness: &Awareness) -> Result<Vec<u8>, SyncError> {
    let mut encoder = EncoderV1::new();
    PROTOCOL.start(awareness, &mut encoder)?;
    Ok(encoder.to_vec())
}

pub fn process_payload(
    awareness: &mut Awareness,
    input: &[u8],
) -> Result<ProcessResult, SyncError> {
    let mut replies: Vec<Vec<u8>> = Vec::new();
    let mut awareness_broadcast: Vec<Vec<u8>> = Vec::new();

    let mut decoder = DecoderV1::new(Cursor::new(input));
    let reader = MessageReader::new(&mut decoder);
    for msg in reader {
        let msg = msg?;
        let reply = match msg {
            Message::Sync(SyncMessage::SyncStep1(sv)) => PROTOCOL.handle_sync_step1(awareness, sv)?,
            Message::Sync(SyncMessage::SyncStep2(update)) => {
                let upd = Update::decode_v1(&update)?;
                PROTOCOL.handle_sync_step2(awareness, upd)?
            }
            Message::Sync(SyncMessage::Update(update)) => {
                let upd = Update::decode_v1(&update)?;
                PROTOCOL.handle_update(awareness, upd)?
            }
            Message::Awareness(update) => {
                awareness_broadcast.push(Message::Awareness(update.clone()).encode_v1());
                PROTOCOL.handle_awareness_update(awareness, update)?
            }
            Message::AwarenessQuery => PROTOCOL.handle_awareness_query(awareness)?,
            Message::Auth(reason) => PROTOCOL.handle_auth(awareness, reason)?,
            Message::Custom(tag, data) => PROTOCOL.missing_handle(awareness, tag, data)?,
        };
        if let Some(reply) = reply {
            replies.push(reply.encode_v1());
        }
    }
    Ok(ProcessResult {
        replies,
        awareness_broadcast,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use yrs::sync::Awareness;
    use yrs::{Doc, GetString, ReadTxn, Text, Transact};

    const TEXT_NAME: &str = "markdown";

    fn seeded_awareness(content: &str) -> Awareness {
        let doc = Doc::new();
        let text = doc.get_or_insert_text(TEXT_NAME);
        let mut txn = doc.transact_mut();
        text.insert(&mut txn, 0, content);
        drop(txn);
        Awareness::new(doc)
    }

    #[test]
    fn sync_step1_reply_hydrates_remote_doc() {
        let mut server = seeded_awareness("hello world");

        // Simulate a fresh client asking for updates from empty state.
        let client_doc = Doc::new();
        let client_sv = client_doc.transact().state_vector();
        let payload = Message::Sync(SyncMessage::SyncStep1(client_sv)).encode_v1();

        let res = process_payload(&mut server, &payload).expect("process");
        assert_eq!(res.replies.len(), 1, "should produce one sync-step-2 reply");

        // The reply fed back into the client's doc should hydrate it.
        let mut decoder = DecoderV1::new(Cursor::new(&res.replies[0]));
        let msg = MessageReader::new(&mut decoder)
            .next()
            .expect("one msg")
            .expect("decode ok");
        let update = match msg {
            Message::Sync(SyncMessage::SyncStep2(u)) => u,
            other => panic!("expected SyncStep2, got {:?}", other),
        };
        let update = Update::decode_v1(&update).expect("decode update");
        client_doc
            .get_or_insert_text(TEXT_NAME)
            .get_string(&client_doc.transact());
        client_doc.transact_mut().apply_update(update);
        assert_eq!(
            client_doc
                .get_or_insert_text(TEXT_NAME)
                .get_string(&client_doc.transact()),
            "hello world"
        );
    }

    #[test]
    fn update_applies_to_server_and_produces_no_reply() {
        let mut server = seeded_awareness("abc");

        // Build an update on a separate doc that inserts " def" at the end.
        let client_doc = Doc::new();
        client_doc
            .transact_mut()
            .apply_update(
                Update::decode_v1(
                    &server
                        .doc()
                        .transact()
                        .encode_state_as_update_v1(&yrs::StateVector::default()),
                )
                .unwrap(),
            );
        let before = client_doc.transact().state_vector();
        {
            let text = client_doc.get_or_insert_text(TEXT_NAME);
            let mut txn = client_doc.transact_mut();
            let len = text.get_string(&txn).len() as u32;
            text.insert(&mut txn, len, " def");
        }
        let update_bytes = client_doc.transact().encode_state_as_update_v1(&before);

        let payload = Message::Sync(SyncMessage::Update(update_bytes)).encode_v1();
        let res = process_payload(&mut server, &payload).expect("process");
        assert!(res.replies.is_empty(), "updates do not solicit replies");

        let doc = server.doc();
        let txn = doc.transact();
        let text = txn.get_text(TEXT_NAME).expect("text");
        assert_eq!(text.get_string(&txn), "abc def");
    }
}
