use std::collections::HashMap;
use std::sync::atomic::Ordering;
use std::sync::Arc;

use tokio::sync::{broadcast, Mutex};
use uuid::Uuid;

use crate::error::Error;

use super::session::DocumentSession;

pub struct SessionRegistry {
    inner: Mutex<HashMap<Uuid, Arc<DocumentSession>>>,
}

impl SessionRegistry {
    pub fn new() -> Self {
        Self {
            inner: Mutex::new(HashMap::new()),
        }
    }

    pub async fn join(
        &self,
        channel_id: Uuid,
    ) -> Result<(Arc<DocumentSession>, broadcast::Receiver<Vec<u8>>), Error> {
        let mut guard = self.inner.lock().await;
        let session = match guard.get(&channel_id) {
            Some(existing) => existing.clone(),
            None => {
                let session = Arc::new(DocumentSession::open(channel_id).await?);
                guard.insert(channel_id, session.clone());
                session
            }
        };
        let rx = session.broadcast.subscribe();
        session.clients.fetch_add(1, Ordering::Relaxed);
        Ok((session, rx))
    }

    pub async fn leave(&self, channel_id: Uuid) {
        let mut guard = self.inner.lock().await;
        let session = match guard.get(&channel_id) {
            Some(s) => s.clone(),
            None => return,
        };
        let prev = session.clients.fetch_sub(1, Ordering::Relaxed);
        if prev == 1 {
            let session = match guard.remove(&channel_id) {
                Some(s) => s,
                None => return,
            };
            drop(guard);
            if let Err(err) = session.flush().await {
                log::warn!(
                    "collab: final flush failed for channel {}: {:?}",
                    channel_id,
                    err
                );
            }
        }
    }
}
