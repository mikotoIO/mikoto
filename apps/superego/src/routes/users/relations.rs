use std::sync::Arc;

use aide::axum::routing::{delete_with, get_with, post_with};
use axum::{extract::Path, Json};
use tokio::sync::RwLock;
use uuid::Uuid;

use crate::{
    db::db,
    entities::{
        Channel, ChannelType, ObjectWithId, Relationship, RelationshipExt, RelationState, User,
    },
    error::Error,
    functions::{jwt::Claims, pubsub::emit_event, time::Timestamp},
    routes::{router::AppRouter, ws::state::State},
};

async fn list(claim: Claims) -> Result<Json<Vec<RelationshipExt>>, Error> {
    let user_id: Uuid = claim.sub.parse()?;
    let rels = Relationship::list_by_user(user_id, db()).await?;
    let rels = RelationshipExt::dataload(rels, db()).await?;
    Ok(rels.into())
}

async fn get(claim: Claims, Path(relation_id): Path<Uuid>) -> Result<Json<RelationshipExt>, Error> {
    let user_id: Uuid = claim.sub.parse()?;
    let rel = Relationship::find_by_pair(user_id, relation_id, db())
        .await?
        .ok_or(Error::NotFound)?;
    let rel = RelationshipExt::from_relationship(rel, db()).await?;
    Ok(rel.into())
}

async fn send_request(
    claim: Claims,
    Path(relation_id): Path<Uuid>,
) -> Result<Json<RelationshipExt>, Error> {
    let user_id: Uuid = claim.sub.parse()?;

    if user_id == relation_id {
        return Err(Error::new(
            "CannotFriendSelf",
            axum::http::StatusCode::BAD_REQUEST,
            "You cannot send a friend request to yourself",
        ));
    }

    // Verify target user exists
    User::find_by_id(relation_id, db()).await?;

    // Check for existing relationship
    if let Some(existing) = Relationship::find_by_pair(user_id, relation_id, db()).await? {
        match existing.state {
            RelationState::Blocked => {
                return Err(Error::forbidden("Cannot send friend request to this user"));
            }
            RelationState::Friend | RelationState::OutgoingRequest => {
                // Already friends or already sent — return existing
                let ext = RelationshipExt::from_relationship(existing, db()).await?;
                return Ok(ext.into());
            }
            RelationState::IncomingRequest => {
                // They already sent us a request — auto-accept
                return accept_inner(user_id, relation_id).await;
            }
            RelationState::None => {
                // Clean up stale NONE state and proceed to create
                Relationship::delete_pair(user_id, relation_id, db()).await?;
            }
        }
    }

    // Also check if the other user has blocked us
    if let Some(their_rel) = Relationship::find_by_pair(relation_id, user_id, db()).await? {
        if their_rel.state == RelationState::Blocked {
            return Err(Error::forbidden("Cannot send friend request to this user"));
        }
    }

    // Create paired rows in a transaction
    let mut tx = db().begin().await?;
    let my_rel = Relationship::new(user_id, relation_id, RelationState::OutgoingRequest);
    let their_rel = Relationship::new(relation_id, user_id, RelationState::IncomingRequest);
    my_rel.create(&mut *tx).await?;
    their_rel.create(&mut *tx).await?;
    tx.commit().await?;

    let my_ext = RelationshipExt::from_relationship(my_rel, db()).await?;
    let their_ext = RelationshipExt::from_relationship(their_rel, db()).await?;

    emit_event("relations.onCreate", &my_ext, &format!("user:{user_id}")).await?;
    emit_event(
        "relations.onCreate",
        &their_ext,
        &format!("user:{relation_id}"),
    )
    .await?;

    Ok(my_ext.into())
}

/// Shared accept logic, used by both accept endpoint and auto-accept in send_request
async fn accept_inner(
    user_id: Uuid,
    relation_id: Uuid,
) -> Result<Json<RelationshipExt>, Error> {
    let my_rel = Relationship::find_by_pair(user_id, relation_id, db())
        .await?
        .ok_or(Error::NotFound)?;
    let their_rel = Relationship::find_by_pair(relation_id, user_id, db())
        .await?
        .ok_or(Error::NotFound)?;

    let my_rel = my_rel.update_state(RelationState::Friend, db()).await?;
    let their_rel = their_rel.update_state(RelationState::Friend, db()).await?;

    let my_ext = RelationshipExt::from_relationship(my_rel, db()).await?;
    let their_ext = RelationshipExt::from_relationship(their_rel, db()).await?;

    emit_event(
        "relations.onUpdate",
        &my_ext,
        &format!("user:{user_id}"),
    )
    .await?;
    emit_event(
        "relations.onUpdate",
        &their_ext,
        &format!("user:{relation_id}"),
    )
    .await?;

    Ok(my_ext.into())
}

async fn accept(
    claim: Claims,
    Path(relation_id): Path<Uuid>,
) -> Result<Json<RelationshipExt>, Error> {
    let user_id: Uuid = claim.sub.parse()?;

    let my_rel = Relationship::find_by_pair(user_id, relation_id, db())
        .await?
        .ok_or(Error::NotFound)?;

    if my_rel.state != RelationState::IncomingRequest {
        return Err(Error::new(
            "NotIncomingRequest",
            axum::http::StatusCode::BAD_REQUEST,
            "No incoming friend request from this user",
        ));
    }

    accept_inner(user_id, relation_id).await
}

async fn decline(
    claim: Claims,
    Path(relation_id): Path<Uuid>,
) -> Result<Json<()>, Error> {
    let user_id: Uuid = claim.sub.parse()?;

    let my_rel = Relationship::find_by_pair(user_id, relation_id, db())
        .await?
        .ok_or(Error::NotFound)?;

    if my_rel.state != RelationState::IncomingRequest {
        return Err(Error::new(
            "NotIncomingRequest",
            axum::http::StatusCode::BAD_REQUEST,
            "No incoming friend request from this user",
        ));
    }

    // Get both IDs before deleting
    let their_rel = Relationship::find_by_pair(relation_id, user_id, db())
        .await?
        .ok_or(Error::NotFound)?;

    Relationship::delete_pair(user_id, relation_id, db()).await?;

    emit_event(
        "relations.onDelete",
        &ObjectWithId::from_id(my_rel.id),
        &format!("user:{user_id}"),
    )
    .await?;
    emit_event(
        "relations.onDelete",
        &ObjectWithId::from_id(their_rel.id),
        &format!("user:{relation_id}"),
    )
    .await?;

    Ok(().into())
}

async fn remove(
    claim: Claims,
    Path(relation_id): Path<Uuid>,
) -> Result<Json<()>, Error> {
    let user_id: Uuid = claim.sub.parse()?;

    let my_rel = Relationship::find_by_pair(user_id, relation_id, db())
        .await?
        .ok_or(Error::NotFound)?;

    match my_rel.state {
        RelationState::Friend | RelationState::OutgoingRequest => {}
        _ => {
            return Err(Error::new(
                "CannotRemove",
                axum::http::StatusCode::BAD_REQUEST,
                "Cannot remove this relationship",
            ));
        }
    }

    let their_rel = Relationship::find_by_pair(relation_id, user_id, db())
        .await?
        .ok_or(Error::NotFound)?;

    // Clean up orphaned DM channel before deleting relationships
    let dm_channel_id = my_rel.channel_id;

    Relationship::delete_pair(user_id, relation_id, db()).await?;

    if let Some(channel_id) = dm_channel_id {
        let channel = Channel::find_by_id(channel_id, db()).await?;
        channel.delete(db()).await?;
    }

    emit_event(
        "relations.onDelete",
        &ObjectWithId::from_id(my_rel.id),
        &format!("user:{user_id}"),
    )
    .await?;
    emit_event(
        "relations.onDelete",
        &ObjectWithId::from_id(their_rel.id),
        &format!("user:{relation_id}"),
    )
    .await?;

    Ok(().into())
}

async fn block(
    claim: Claims,
    Path(relation_id): Path<Uuid>,
) -> Result<Json<RelationshipExt>, Error> {
    let user_id: Uuid = claim.sub.parse()?;

    if user_id == relation_id {
        return Err(Error::new(
            "CannotBlockSelf",
            axum::http::StatusCode::BAD_REQUEST,
            "You cannot block yourself",
        ));
    }

    // Verify target user exists
    User::find_by_id(relation_id, db()).await?;

    // Remove any existing relationship first, cleaning up DM channel
    let existing_rel = Relationship::find_by_pair(user_id, relation_id, db()).await?;
    let dm_channel_id = existing_rel.and_then(|r| r.channel_id);

    Relationship::delete_pair(user_id, relation_id, db()).await?;

    if let Some(channel_id) = dm_channel_id {
        let channel = Channel::find_by_id(channel_id, db()).await?;
        channel.delete(db()).await?;
    }

    // Create block row (only one direction — the blocker's row)
    let my_rel = Relationship::new(user_id, relation_id, RelationState::Blocked);
    my_rel.create(db()).await?;

    let my_ext = RelationshipExt::from_relationship(my_rel, db()).await?;

    emit_event(
        "relations.onCreate",
        &my_ext,
        &format!("user:{user_id}"),
    )
    .await?;

    Ok(my_ext.into())
}

async fn unblock(
    claim: Claims,
    Path(relation_id): Path<Uuid>,
) -> Result<Json<()>, Error> {
    let user_id: Uuid = claim.sub.parse()?;

    let my_rel = Relationship::find_by_pair(user_id, relation_id, db())
        .await?
        .ok_or(Error::NotFound)?;

    if my_rel.state != RelationState::Blocked {
        return Err(Error::new(
            "NotBlocked",
            axum::http::StatusCode::BAD_REQUEST,
            "This user is not blocked",
        ));
    }

    Relationship::delete_pair(user_id, relation_id, db()).await?;

    emit_event(
        "relations.onDelete",
        &ObjectWithId::from_id(my_rel.id),
        &format!("user:{user_id}"),
    )
    .await?;

    Ok(().into())
}

async fn open_dm(
    claim: Claims,
    Path(relation_id): Path<Uuid>,
) -> Result<Json<Channel>, Error> {
    let user_id: Uuid = claim.sub.parse()?;

    // Use a transaction with FOR UPDATE to prevent race conditions
    let mut tx = db().begin().await?;

    let my_rel: Option<Relationship> = sqlx::query_as(
        r##"
        SELECT * FROM "Relationship"
        WHERE "userId" = $1 AND "relationId" = $2
        FOR UPDATE
        "##,
    )
    .bind(user_id)
    .bind(relation_id)
    .fetch_optional(&mut *tx)
    .await?;

    let my_rel = my_rel.ok_or(Error::NotFound)?;

    if my_rel.state != RelationState::Friend {
        return Err(Error::forbidden("You must be friends to open a DM"));
    }

    // If DM channel already exists, return it
    if let Some(channel_id) = my_rel.channel_id {
        let channel = Channel::find_by_id(channel_id, &mut *tx).await?;
        tx.commit().await?;
        return Ok(channel.into());
    }

    // Create a standalone DM channel (no space)
    let other_user = User::find_by_id(relation_id, &mut *tx).await?;
    let channel = Channel {
        id: Uuid::new_v4(),
        space_id: None,
        parent_id: None,
        order: 0,
        name: other_user.name.clone(),
        category: ChannelType::Text,
        last_updated: Some(Timestamp::now()),
    };
    channel.create(&mut *tx).await?;

    // Update channelId on both relationship rows
    Relationship::set_channel_id(user_id, relation_id, channel.id, &mut *tx).await?;

    // Re-read within transaction for the event payloads
    let my_rel = Relationship::find_by_pair(user_id, relation_id, &mut *tx)
        .await?
        .ok_or(Error::NotFound)?;
    let their_rel = Relationship::find_by_pair(relation_id, user_id, &mut *tx)
        .await?
        .ok_or(Error::NotFound)?;

    tx.commit().await?;

    let my_ext = RelationshipExt::from_relationship(my_rel, db()).await?;
    let their_ext = RelationshipExt::from_relationship(their_rel, db()).await?;

    emit_event("relations.onUpdate", &my_ext, &format!("user:{user_id}")).await?;
    emit_event(
        "relations.onUpdate",
        &their_ext,
        &format!("user:{relation_id}"),
    )
    .await?;

    Ok(channel.into())
}

static TAG: &str = "Relations";

pub fn router() -> AppRouter<State> {
    AppRouter::new()
        .route(
            "/",
            get_with(list, |o| {
                o.tag(TAG)
                    .id("relations.list")
                    .summary("List Relationships")
            }),
        )
        .route(
            "/:relationId",
            get_with(get, |o| {
                o.tag(TAG).id("relations.get").summary("Get Relationship")
            }),
        )
        .route(
            "/:relationId/request",
            post_with(send_request, |o| {
                o.tag(TAG)
                    .id("relations.sendRequest")
                    .summary("Send Friend Request")
            }),
        )
        .route(
            "/:relationId/accept",
            post_with(accept, |o| {
                o.tag(TAG)
                    .id("relations.accept")
                    .summary("Accept Friend Request")
            }),
        )
        .route(
            "/:relationId/decline",
            post_with(decline, |o| {
                o.tag(TAG)
                    .id("relations.decline")
                    .summary("Decline Friend Request")
            }),
        )
        .route(
            "/:relationId",
            delete_with(remove, |o| {
                o.tag(TAG)
                    .id("relations.remove")
                    .summary("Remove Friend")
            }),
        )
        .route(
            "/:relationId/block",
            post_with(block, |o| {
                o.tag(TAG)
                    .id("relations.block")
                    .summary("Block User")
            }),
        )
        .route(
            "/:relationId/block",
            delete_with(unblock, |o| {
                o.tag(TAG)
                    .id("relations.unblock")
                    .summary("Unblock User")
            }),
        )
        .route(
            "/:relationId/dm",
            post_with(open_dm, |o| {
                o.tag(TAG)
                    .id("relations.openDm")
                    .summary("Open Direct Messages")
            }),
        )
        .ws_event(
            "onCreate",
            |rel: RelationshipExt, _: Arc<RwLock<State>>| async move { Some(rel) },
        )
        .ws_event(
            "onUpdate",
            |rel: RelationshipExt, _: Arc<RwLock<State>>| async move { Some(rel) },
        )
        .ws_event(
            "onDelete",
            |rel: ObjectWithId, _: Arc<RwLock<State>>| async move { Some(rel) },
        )
}
