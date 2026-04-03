use std::sync::RwLock;

use dashmap::mapref::one::Ref;
use dashmap::DashMap;
use uuid::Uuid;

use crate::generated::*;

/// Concurrent, in-memory cache of Mikoto state.
///
/// Automatically populated from the initial `spaces_list` call and kept
/// up-to-date by WebSocket events. All methods are lock-free for reads
/// (backed by [`DashMap`]).
pub struct Cache {
    current_user: RwLock<Option<UserExt>>,
    spaces: DashMap<Uuid, SpaceExt>,
    channels: DashMap<Uuid, Channel>,
    roles: DashMap<Uuid, Role>,
    members: DashMap<(Uuid, Uuid), MemberExt>,
    users: DashMap<Uuid, UserExt>,
}

impl Cache {
    pub(crate) fn new() -> Self {
        Self {
            current_user: RwLock::new(None),
            spaces: DashMap::new(),
            channels: DashMap::new(),
            roles: DashMap::new(),
            members: DashMap::new(),
            users: DashMap::new(),
        }
    }

    // ── Public accessors ──────────────────────────────────────────────

    /// The bot's own user, populated during [`BotClient::build`].
    pub fn current_user(&self) -> Option<UserExt> {
        self.current_user.read().unwrap().clone()
    }

    pub fn space(&self, id: Uuid) -> Option<Ref<'_, Uuid, SpaceExt>> {
        self.spaces.get(&id)
    }

    pub fn channel(&self, id: Uuid) -> Option<Ref<'_, Uuid, Channel>> {
        self.channels.get(&id)
    }

    pub fn role(&self, id: Uuid) -> Option<Ref<'_, Uuid, Role>> {
        self.roles.get(&id)
    }

    pub fn member(
        &self,
        space_id: Uuid,
        user_id: Uuid,
    ) -> Option<Ref<'_, (Uuid, Uuid), MemberExt>> {
        self.members.get(&(space_id, user_id))
    }

    pub fn user(&self, id: Uuid) -> Option<Ref<'_, Uuid, UserExt>> {
        self.users.get(&id)
    }

    pub fn spaces(&self) -> &DashMap<Uuid, SpaceExt> {
        &self.spaces
    }

    pub fn channels(&self) -> &DashMap<Uuid, Channel> {
        &self.channels
    }

    pub fn roles(&self) -> &DashMap<Uuid, Role> {
        &self.roles
    }

    pub fn members(&self) -> &DashMap<(Uuid, Uuid), MemberExt> {
        &self.members
    }

    pub fn users(&self) -> &DashMap<Uuid, UserExt> {
        &self.users
    }

    /// Return all channels that belong to a given space.
    pub fn channels_in_space(&self, space_id: Uuid) -> Vec<Channel> {
        self.channels
            .iter()
            .filter(|entry| entry.value().space_id == space_id)
            .map(|entry| entry.value().clone())
            .collect()
    }

    /// Return all roles that belong to a given space.
    pub fn roles_in_space(&self, space_id: Uuid) -> Vec<Role> {
        self.roles
            .iter()
            .filter(|entry| entry.value().space_id == space_id)
            .map(|entry| entry.value().clone())
            .collect()
    }

    /// Return all members in a given space.
    pub fn members_in_space(&self, space_id: Uuid) -> Vec<MemberExt> {
        self.members
            .iter()
            .filter(|entry| entry.key().0 == space_id)
            .map(|entry| entry.value().clone())
            .collect()
    }

    // ── Internal mutators ─────────────────────────────────────────────

    pub(crate) fn set_current_user(&self, user: UserExt) {
        *self.current_user.write().unwrap() = Some(user);
    }

    /// Populate the cache from the initial `spaces_list` response.
    pub(crate) fn populate_from_spaces(&self, spaces: &[SpaceExt]) {
        for space in spaces {
            for channel in &space.channels {
                self.channels.insert(channel.id, channel.clone());
            }
            for role in &space.roles {
                self.roles.insert(role.id, role.clone());
            }
            self.spaces.insert(space.id, space.clone());
        }
    }

    /// Apply a WebSocket event to the cache, returning `true` if the event
    /// was recognized and applied.
    pub(crate) fn update(&self, event: &WsEvent) {
        match event {
            // Channels
            WsEvent::ChannelsOnCreate(ch) | WsEvent::ChannelsOnUpdate(ch) => {
                self.channels.insert(ch.id, ch.clone());
            }
            WsEvent::ChannelsOnDelete(ch) => {
                self.channels.remove(&ch.id);
            }

            // Members
            WsEvent::MembersOnCreate(m) | WsEvent::MembersOnUpdate(m) => {
                self.members.insert((m.space_id, m.user_id), m.clone());
            }
            WsEvent::MembersOnDelete(m) => {
                self.members.remove(&(m.space_id, m.user_id));
            }

            // Roles
            WsEvent::RolesOnCreate(r) | WsEvent::RolesOnUpdate(r) => {
                self.roles.insert(r.id, r.clone());
            }
            WsEvent::RolesOnDelete(r) => {
                self.roles.remove(&r.id);
            }

            // Spaces
            WsEvent::SpacesOnCreate(s) | WsEvent::SpacesOnUpdate(s) => {
                // Also update embedded channels/roles
                for channel in &s.channels {
                    self.channels.insert(channel.id, channel.clone());
                }
                for role in &s.roles {
                    self.roles.insert(role.id, role.clone());
                }
                self.spaces.insert(s.id, s.clone());
            }
            WsEvent::SpacesOnDelete(s) => {
                // Remove the space and all its channels/roles
                for channel in &s.channels {
                    self.channels.remove(&channel.id);
                }
                for role in &s.roles {
                    self.roles.remove(&role.id);
                }
                self.spaces.remove(&s.id);
            }

            // Users
            WsEvent::UsersOnCreate(u) | WsEvent::UsersOnUpdate(u) => {
                self.users.insert(u.id, u.clone());
                // Update current_user if it matches
                let is_self = self
                    .current_user
                    .read()
                    .unwrap()
                    .as_ref()
                    .is_some_and(|c| c.id == u.id);
                if is_self {
                    *self.current_user.write().unwrap() = Some(u.clone());
                }
            }
            WsEvent::UsersOnDelete(obj) => {
                self.users.remove(&obj.id);
            }

            // Messages, typing, and pong don't affect the cache
            WsEvent::MessagesOnCreate(_)
            | WsEvent::MessagesOnDelete(_)
            | WsEvent::MessagesOnUpdate(_)
            | WsEvent::TypingOnUpdate(_)
            | WsEvent::Pong(_)
            | WsEvent::MlsMessagesOnHandshake(_)
            | WsEvent::MlsMessagesOnWelcome(_)
            | WsEvent::RelationsOnAccept(_)
            | WsEvent::RelationsOnRemove(_)
            | WsEvent::RelationsOnRequest(_) => {}
        }
    }
}
