use aide::axum::routing::{delete_with, get_with, post_with};
use axum::{extract::Path, Json};
use schemars::JsonSchema;
use uuid::Uuid;

use crate::{
    db::db,
    entities::{Ban, MemberExt, MemberKey, SpaceExt, SpaceUser, User},
    error::Error,
    functions::{
        jwt::Claims,
        permissions::{permissions_or_admin, Permission},
        pubsub::emit_event,
    },
    middlewares::load::Load,
    routes::{router::AppRouter, ws::state::State},
};

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct BanCreatePayload {
    pub user_id: Uuid,
    pub reason: Option<String>,
}

#[derive(Serialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct BanInfo {
    pub id: Uuid,
    pub user_id: Uuid,
    pub space_id: Uuid,
    pub reason: Option<String>,
    pub user: Option<User>,
}

async fn list(
    _claim: Claims,
    Load(space): Load<SpaceExt>,
    Load(acting_member): Load<MemberExt>,
    Path(space_id): Path<Uuid>,
) -> Result<Json<Vec<BanInfo>>, Error> {
    permissions_or_admin(&space, &acting_member, Permission::BAN)?;

    let bans = Ban::list_by_space(space_id, db()).await?;
    let user_ids: Vec<Uuid> = bans.iter().map(|b| b.user_id).collect();
    let user_map = User::dataload(user_ids, db()).await?;

    let ban_infos: Vec<BanInfo> = bans
        .into_iter()
        .map(|b| BanInfo {
            id: b.id,
            user_id: b.user_id,
            space_id: b.space_id,
            reason: b.reason,
            user: user_map.get(&b.user_id).cloned(),
        })
        .collect();

    Ok(ban_infos.into())
}

async fn create(
    _claim: Claims,
    Load(space): Load<SpaceExt>,
    Load(acting_member): Load<MemberExt>,
    Path(space_id): Path<Uuid>,
    Json(body): Json<BanCreatePayload>,
) -> Result<Json<BanInfo>, Error> {
    if acting_member.user.base.id == body.user_id {
        return Err(Error::forbidden("You cannot ban yourself"));
    }
    permissions_or_admin(&space, &acting_member, Permission::BAN)?;

    // Check if already banned
    if Ban::find_by_space_and_user(space_id, body.user_id, db())
        .await?
        .is_some()
    {
        return Err(Error::forbidden("User is already banned from this space"));
    }

    // Create ban record
    let ban = Ban {
        id: Uuid::new_v4(),
        user_id: body.user_id,
        space_id,
        reason: body.reason,
    };
    ban.create(db()).await?;

    // Remove membership if the user is currently a member
    let key = MemberKey::new(space_id, body.user_id);
    if let Ok(member) = SpaceUser::get_by_key(&key, db()).await {
        let member = MemberExt::dataload_one(member, db()).await?;
        member.base.delete(db()).await?;
        emit_event("members.onDelete", &member, &format!("space:{space_id}")).await?;
    }

    let user = User::find_by_id(body.user_id, db()).await.ok();

    Ok(Json(BanInfo {
        id: ban.id,
        user_id: ban.user_id,
        space_id: ban.space_id,
        reason: ban.reason,
        user,
    }))
}

async fn delete(
    _claim: Claims,
    Load(space): Load<SpaceExt>,
    Load(acting_member): Load<MemberExt>,
    Path((space_id, user_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<()>, Error> {
    permissions_or_admin(&space, &acting_member, Permission::BAN)?;

    Ban::delete_by_space_and_user(space_id, user_id, db()).await?;
    Ok(().into())
}

static TAG: &str = "Bans";

pub fn router() -> AppRouter<State> {
    AppRouter::new()
        .route(
            "/",
            get_with(list, |o| o.tag(TAG).id("bans.list").summary("List Bans")),
        )
        .route(
            "/",
            post_with(create, |o| o.tag(TAG).id("bans.create").summary("Ban User")),
        )
        .route(
            "/:userId",
            delete_with(delete, |o| {
                o.tag(TAG).id("bans.delete").summary("Unban User")
            }),
        )
}
