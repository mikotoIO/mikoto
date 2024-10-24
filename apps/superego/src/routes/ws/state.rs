use serde::{de::DeserializeOwned, Serialize};
use uuid::Uuid;

use crate::{
    db::db,
    entities::{Space, User},
    error::Error,
    functions::jwt::{jwt_key, Claims},
};

use super::{SocketAction, WebSocketState};

pub struct State {
    pub conn_id: Uuid,
    pub user: User,
    pub actions: Vec<SocketAction>,
}

#[derive(Deserialize)]
pub struct WebsocketParams {
    pub token: Option<String>,
}

#[async_trait]
impl WebSocketState for State {
    type Initial = WebsocketParams;

    fn clear_actions(&mut self) -> Vec<SocketAction> {
        std::mem::take(&mut self.actions)
    }

    async fn initialize(params: Self::Initial) -> Result<(Self, Vec<String>), Error> {
        let conn_id = Uuid::new_v4();
        let claims = Claims::decode(
            &params
                .token
                .ok_or(Error::unauthorized("Token not provided"))?,
            jwt_key(),
        )?;
        let (user, spaces) = tokio::try_join!(
            User::find_by_id(claims.sub.parse()?, db()),
            Space::list_from_user_id(claims.sub.parse()?, db())
        )?;

        let user_id = user.id;
        let state = Self {
            conn_id,
            user,
            actions: vec![],
        };

        let mut initial_subs = vec![
            "all".to_string(),
            format!("conn:{}", conn_id),
            format!("user:{}", user_id),
        ];

        initial_subs.extend(spaces.into_iter().map(|x| format!("space:{}", x.id)));

        Ok((state, initial_subs))
    }
}

pub trait SocketEvent
where
    Self: Sized + Serialize + DeserializeOwned,
{
    fn name() -> &'static str;
    fn into_message(self, state: State) -> Option<Self>;
}
