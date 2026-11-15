//! Fixtures that write straight to the database, so tests can set up users,
//! spaces and roles without going through (and depending on) the API.

use superego::{
    db::db,
    entities::{Account, Channel, Message, Role, RoleToSpaceUser, Space, SpaceUser},
    functions::{
        jwt::{jwt_key, Claims},
        permissions::Permission,
    },
};
use uuid::Uuid;

pub const PASSWORD: &str = "correct horse battery staple";

#[derive(Clone, Debug)]
pub struct TestUser {
    pub id: Uuid,
    pub name: String,
    pub email: String,
    /// A valid access token for this user.
    pub token: String,
}

/// A fresh user, logged in, with password [`PASSWORD`].
pub async fn user() -> TestUser {
    user_named(&format!("user-{}", short_id())).await
}

pub async fn user_named(name: &str) -> TestUser {
    let id = Uuid::new_v4();
    let account = Account {
        id,
        email: format!("{id}@example.test"),
        // Minimum cost keeps fixtures fast; login still verifies it.
        passhash: bcrypt::hash(PASSWORD, 4).unwrap(),
    };
    account.create_with_user(name, db()).await.unwrap();
    TestUser {
        id,
        name: name.to_string(),
        email: account.email.clone(),
        token: Claims::from(&account).encode(jwt_key()).unwrap(),
    }
}

#[derive(Clone, Debug)]
pub struct TestSpace {
    pub id: Uuid,
    pub owner: TestUser,
    /// The `#general` channel every space starts with.
    pub general: Uuid,
}

impl TestSpace {
    pub fn path(&self, rest: &str) -> String {
        format!("/spaces/{}{}", self.id, rest)
    }

    pub fn messages(&self, channel: Uuid) -> String {
        self.path(&format!("/channels/{channel}/messages"))
    }
}

/// A space owned (and joined) by `owner`.
pub async fn space(owner: &TestUser) -> TestSpace {
    let space = Space::new(format!("space-{}", short_id()), owner.id);
    space.create(db()).await.unwrap();
    SpaceUser::new(space.id, owner.id)
        .create(db())
        .await
        .unwrap();
    let general = Channel::list(space.id, db()).await.unwrap()[0].id;
    TestSpace {
        id: space.id,
        owner: owner.clone(),
        general,
    }
}

/// Add `user` to `space` with no roles. Returns the membership id.
pub async fn join(space: &TestSpace, user: &TestUser) -> Uuid {
    let member = SpaceUser::new(space.id, user.id);
    member.create(db()).await.unwrap();
    member.id
}

/// Create a role in `space` with exactly `permissions`.
pub async fn role(space: &TestSpace, permissions: Permission) -> Uuid {
    let role = Role {
        id: Uuid::new_v4(),
        space_id: space.id,
        name: format!("role-{}", short_id()),
        color: None,
        permissions: permissions.bits().to_string(),
        position: 0,
    };
    role.create(db()).await.unwrap();
    role.id
}

/// A new user who is a member of `space` holding `permissions`.
pub async fn member_with(space: &TestSpace, permissions: Permission) -> TestUser {
    let user = user().await;
    let member_id = join(space, &user).await;
    if !permissions.is_empty() {
        let role_id = role(space, permissions).await;
        RoleToSpaceUser::create(role_id, member_id, db())
            .await
            .unwrap();
    }
    user
}

/// A plain member of `space` with no roles.
pub async fn member(space: &TestSpace) -> TestUser {
    member_with(space, Permission::NONE).await
}

/// Post a message directly, bypassing the API. Returns its id.
pub async fn message(channel_id: Uuid, author: &TestUser, content: &str) -> Uuid {
    let channel = Channel::find_by_id(channel_id, db()).await.unwrap();
    let message = Message::new(&channel, author.id, content.to_string());
    message.create(db()).await.unwrap();
    message.id
}

pub fn short_id() -> String {
    Uuid::new_v4().simple().to_string()[..8].to_string()
}
