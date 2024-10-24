use aide::axum::routing::{delete_with, get_with, patch_with, post_with};
use axum::{extract::Path, Json};
use schemars::JsonSchema;
use uuid::Uuid;

use crate::{
    db::db,
    entities::{MemberExt, MemberKey, Role, RoleToSpaceUser, SpaceExt, SpaceUser},
    error::Error,
    functions::{
        permissions::{permissions_or_admin, Permission},
        pubsub::emit_event,
    },
    middlewares::load::Load,
    routes::{router::AppRouter, ws::state::State},
};

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct MemberCreatePayload {
    pub user_id: Uuid,
}

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct MemberUpdatePayload {
    pub role_ids: Vec<Uuid>,
}

async fn get(Path((space_id, user_id)): Path<(Uuid, Uuid)>) -> Result<Json<MemberExt>, Error> {
    let member = SpaceUser::get_by_key(&MemberKey::new(space_id, user_id), db()).await?;
    let member = MemberExt::dataload_one(member, db()).await?;
    Ok(member.into())
}

async fn list(Path(space_id): Path<Uuid>) -> Result<Json<Vec<MemberExt>>, Error> {
    let members = SpaceUser::list_from_space(space_id, db()).await?;
    let members = MemberExt::dataload(members, db()).await?;

    Ok(members.into())
}

async fn create(_body: Json<MemberCreatePayload>) -> Result<Json<MemberExt>, Error> {
    // Bot-related
    Err(Error::Todo)
}

async fn update(
    _id: Path<Uuid>,
    _body: Json<MemberUpdatePayload>,
) -> Result<Json<MemberExt>, Error> {
    Err(Error::Todo)
}

async fn add_role(
    Path((space_id, user_id, role_id)): Path<(Uuid, Uuid, Uuid)>,
    Load(space): Load<SpaceExt>,
    Load(acting_member): Load<MemberExt>,
) -> Result<Json<MemberExt>, Error> {
    permissions_or_admin(&space, &acting_member, Permission::ASSIGN_ROLES)?;

    let key = MemberKey::new(space_id, user_id);
    let member = SpaceUser::get_by_key(&key, db()).await?;
    let role = Role::find_by_id(role_id, db()).await?;
    if role.space_id != space_id {
        return Err(Error::forbidden("Role does not belong to Space"));
    }

    RoleToSpaceUser::create(role.id, member.id, db()).await?;
    let member = MemberExt::dataload_one(member, db()).await?;
    emit_event("members.onUpdate", &member, &format!("space:{}", space_id)).await?;
    Ok(member.into())
}

async fn remove_role(
    Path((space_id, user_id, role_id)): Path<(Uuid, Uuid, Uuid)>,
    Load(space): Load<SpaceExt>,
    Load(acting_member): Load<MemberExt>,
) -> Result<Json<MemberExt>, Error> {
    permissions_or_admin(&space, &acting_member, Permission::ASSIGN_ROLES)?;

    let key = MemberKey::new(space_id, user_id);
    let member = SpaceUser::get_by_key(&key, db()).await?;
    let role = Role::find_by_id(role_id, db()).await?;
    if role.space_id != space_id {
        return Err(Error::forbidden("Role does not belong to Space"));
    }

    RoleToSpaceUser::delete(role.id, member.id, db()).await?;
    let member = MemberExt::dataload_one(member, db()).await?;
    emit_event("members.onUpdate", &member, &format!("space:{}", space_id)).await?;
    Ok(member.into())
}

async fn delete(
    Load(space): Load<SpaceExt>,
    Load(acting_member): Load<MemberExt>,
    Path((space_id, user_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<()>, Error> {
    permissions_or_admin(&space, &acting_member, Permission::BAN)?;

    // ban user
    let key = MemberKey::new(space_id, user_id);
    let member = SpaceUser::get_by_key(&key, db()).await?;
    let member = MemberExt::dataload_one(member, db()).await?;
    member.base.delete(db()).await?;
    emit_event("members.onDelete", &member, &format!("space:{}", space_id)).await?;
    Ok(().into())
}

static TAG: &str = "Members";

pub fn router() -> AppRouter<State> {
    AppRouter::new()
        .route(
            "/",
            get_with(list, |o| {
                o.tag(TAG)
                    .id("members.list")
                    .summary("List Members in Space")
            }),
        )
        .route(
            "/:userId",
            get_with(get, |o| {
                o.tag(TAG)
                    .id("members.get")
                    .summary("Get Member from Space")
            }),
        )
        .route(
            "/",
            post_with(create, |o| {
                o.tag(TAG).id("members.create").summary("Add Bot Member")
            }),
        )
        .route(
            "/:userId",
            patch_with(update, |o| {
                o.tag(TAG).id("members.update").summary("Update Member")
            }),
        )
        .route(
            "/:userId",
            delete_with(delete, |o| {
                o.tag(TAG).id("members.delete").summary("Ban Member")
            }),
        )
        .route(
            "/:userId/roles/:roleId",
            post_with(add_role, |o| {
                o.tag(TAG)
                    .id("members.addRole")
                    .summary("Add Role to Member")
            }),
        )
        .route(
            "/:userId/roles/:roleId",
            delete_with(remove_role, |o| {
                o.tag(TAG)
                    .id("members.removeRole")
                    .summary("Remove Role from Member")
            }),
        )
        .ws_event(
            "onCreate",
            |member: MemberExt, _| async move { Some(member) },
        )
        .ws_event(
            "onUpdate",
            |member: MemberExt, _| async move { Some(member) },
        )
        .ws_event(
            "onDelete",
            |member: MemberExt, _| async move { Some(member) },
        )
}
