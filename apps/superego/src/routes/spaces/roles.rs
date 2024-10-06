use aide::axum::routing::{delete_with, patch_with, post_with};
use axum::{extract::Path, Json};
use schemars::JsonSchema;
use uuid::Uuid;

use crate::{
    db::db,
    entities::{Role, RolePatch},
    error::Error,
    routes::{router::AppRouter, ws::state::State},
};

#[derive(Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct RoleCreatePayload {
    pub name: String,
}

async fn create(space_id: Path<Uuid>, body: Json<RoleCreatePayload>) -> Result<Json<Role>, Error> {
    let role = Role {
        id: Uuid::new_v4(),
        space_id: *space_id,
        name: body.name.clone(),
        color: None,
        permissions: "0".to_string(),
        position: 0,
    };
    role.create(db()).await?;
    Ok(role.into())
}

async fn update(
    Path((_space_id, role_id)): Path<(Uuid, Uuid)>,
    patch: Json<RolePatch>,
) -> Result<Json<Role>, Error> {
    let role = Role::find_by_id(role_id, db()).await?;
    let role = role.update(&patch, db()).await?;
    Ok(role.into())
}

async fn delete(Path((_space_id, role_id)): Path<(Uuid, Uuid)>) -> Result<Json<()>, Error> {
    let role = Role::find_by_id(role_id, db()).await?;
    role.delete(db()).await?;
    Ok(Json(()))
}

static TAG: &str = "Roles";

pub fn router() -> AppRouter<State> {
    AppRouter::new()
        .route(
            "/",
            post_with(create, |o| {
                o.tag(TAG).id("roles.create").summary("Create Role")
            }),
        )
        .route(
            "/:roleId",
            patch_with(update, |o| {
                o.tag(TAG).id("roles.update").summary("Update Role")
            }),
        )
        .route(
            "/:roleId",
            delete_with(delete, |o| {
                o.tag(TAG).id("roles.delete").summary("Delete Role")
            }),
        )
        .ws_event("onCreate", |role: Role, _| async move { Some(role) })
        .ws_event("onUpdate", |role: Role, _| async move { Some(role) })
        .ws_event("onDelete", |role: Role, _| async move { Some(role) })
}
