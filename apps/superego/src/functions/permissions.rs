use std::{collections::HashMap, str::FromStr};

use crate::entities::{MemberExt, SpaceExt};

// TODO: Write this as an axum extractor as well

#[repr(u64)]
pub enum Permission {
    Admin = 1 << 0,
    Moderator = 1 << 1,

    ManageSpace = 1 << 2,
    ManageChannels = 1 << 3,
    ManageRoles = 1 << 4,
    AssignRoles = 1 << 5,
    ManageMemberProfiles = 1 << 6,
    ManageInvites = 1 << 7,
    ManageEmojis = 1 << 8,
    ManageMessages = 1 << 9,
    ManageBots = 1 << 10,
    Ban = 1 << 11,
}

fn collect_permissions(space: &SpaceExt, member: &MemberExt) -> Vec<u64> {
    // collect the roles into a hashmap by id

    let role_map: HashMap<_, _> = space.roles.iter().map(|role| (role.id, role)).collect();
    member
        .role_ids
        .iter()
        .filter_map(|role_id| {
            role_map
                .get(role_id)
                .map(|role| u64::from_str(&role.permissions))
                .transpose()
                .ok()
                .flatten()
        })
        .collect()
}

/// Check if a user is allowed to perform an action.
/// Returns true if the user has the required permissions.
pub fn permissions(space: SpaceExt, member: MemberExt) -> bool {
    // Owner bypasses all permissions
    if space.base.owner_id == Some(member.user.id) {
        return true;
    }
    let _perms = collect_permissions(&space, &member);

    return false;
}
