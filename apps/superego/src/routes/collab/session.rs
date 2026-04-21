use std::sync::atomic::AtomicUsize;
use std::sync::Arc;
use std::time::Duration;

use tokio::sync::{broadcast, Notify, RwLock};
use tokio::task::JoinHandle;
use uuid::Uuid;
use yrs::sync::{Awareness, Message, SyncMessage};
use yrs::updates::encoder::Encode;
use yrs::{Doc, GetString, ReadTxn, Subscription, Text, Transact};

use crate::db::db;
use crate::entities::{Channel, Document, DocumentPatch};
use crate::error::Error;
use crate::functions::pubsub::emit_event;
use crate::functions::time::Timestamp;

const DEBOUNCE_IDLE: Duration = Duration::from_secs(2);
const DEBOUNCE_MAX: Duration = Duration::from_secs(10);
const BROADCAST_CAPACITY: usize = 128;
pub const TEXT_NAME: &str = "markdown";

pub struct DocumentSession {
    pub channel_id: Uuid,
    pub awareness: Arc<RwLock<Awareness>>,
    pub broadcast: broadcast::Sender<Vec<u8>>,
    pub clients: AtomicUsize,
    _dirty: Arc<Notify>,
    save_task: JoinHandle<()>,
    _update_sub: Subscription,
}

impl DocumentSession {
    pub async fn open(channel_id: Uuid) -> Result<Self, Error> {
        let document = Document::get_by_channel_id(channel_id, db()).await?;

        let doc = Doc::new();
        let text = doc.get_or_insert_text(TEXT_NAME);
        {
            let mut txn = doc.transact_mut();
            text.insert(&mut txn, 0, &document.content);
        }

        let (broadcast, _) = broadcast::channel::<Vec<u8>>(BROADCAST_CAPACITY);
        let dirty = Arc::new(Notify::new());

        let observer_broadcast = broadcast.clone();
        let observer_dirty = dirty.clone();
        let update_sub = doc
            .observe_update_v1(move |_, event| {
                let msg =
                    Message::Sync(SyncMessage::Update(event.update.clone())).encode_v1();
                let _ = observer_broadcast.send(msg);
                observer_dirty.notify_one();
            })
            .map_err(|_| Error::internal("failed to register yrs observer"))?;

        let save_doc = doc.clone();
        let save_dirty = dirty.clone();
        let save_task = tokio::spawn(save_loop(channel_id, save_doc, save_dirty));

        let awareness = Arc::new(RwLock::new(Awareness::new(doc)));

        Ok(Self {
            channel_id,
            awareness,
            broadcast,
            clients: AtomicUsize::new(0),
            _dirty: dirty,
            save_task,
            _update_sub: update_sub,
        })
    }

    pub async fn snapshot_markdown(&self) -> String {
        let awareness = self.awareness.read().await;
        let doc = awareness.doc();
        let txn = doc.transact();
        txn.get_text(TEXT_NAME)
            .map(|text| text.get_string(&txn))
            .unwrap_or_default()
    }

    pub async fn flush(&self) -> Result<(), Error> {
        let markdown = self.snapshot_markdown().await;
        persist(self.channel_id, markdown).await
    }
}

impl Drop for DocumentSession {
    fn drop(&mut self) {
        self.save_task.abort();
    }
}

async fn save_loop(channel_id: Uuid, doc: Doc, dirty: Arc<Notify>) {
    loop {
        dirty.notified().await;

        let started = tokio::time::Instant::now();
        loop {
            let remaining = DEBOUNCE_MAX.saturating_sub(started.elapsed());
            let sleep_for = DEBOUNCE_IDLE.min(remaining);
            if sleep_for.is_zero() {
                break;
            }
            tokio::select! {
                _ = dirty.notified() => {
                    if started.elapsed() >= DEBOUNCE_MAX {
                        break;
                    }
                }
                _ = tokio::time::sleep(sleep_for) => {
                    break;
                }
            }
        }

        let markdown = {
            let txn = doc.transact();
            txn.get_text(TEXT_NAME)
                .map(|text| text.get_string(&txn))
                .unwrap_or_default()
        };
        if let Err(err) = persist(channel_id, markdown).await {
            log::warn!(
                "collab: periodic save failed for channel {}: {:?}",
                channel_id,
                err
            );
        }
    }
}

async fn persist(channel_id: Uuid, markdown: String) -> Result<(), Error> {
    let document = Document::get_by_channel_id(channel_id, db()).await?;
    let patch = DocumentPatch {
        content: Some(markdown),
    };
    document.update(patch, db()).await?;
    Channel::update_last_updated(channel_id, Timestamp::now(), db()).await?;
    if let Ok(channel) = Channel::find_by_id(channel_id, db()).await {
        if let Some(space_id) = channel.space_id {
            let _ = emit_event("channels.onUpdate", &channel, &format!("space:{space_id}")).await;
        }
    }
    Ok(())
}
