use std::collections::HashMap;

use crate::entities::{MemberExt, SpaceExt};

// TODO: Write this as an axum extractor as well

fn collect_permissions(space: &SpaceExt, member: &MemberExt) -> Vec<String> {
    // collect the roles into a hashmap by id
    let role_map: HashMap<_, _> = space.roles.iter().map(|role| (role.id, role)).collect();
    member
        .role_ids
        .iter()
        .filter_map(|role_id| role_map.get(role_id))
        .map(|role| role.permissions.clone())
        .collect()
}

/// Check if a user is allowed to perform an action.
/// Returns true if the user has the required permissions.
pub fn permissions(space: SpaceExt, member: MemberExt) -> bool {
    // Owner bypasses all permissions
    if space.base.owner_id == Some(member.user.id) {
        return true;
    }
    let perms = collect_permissions(&space, &member);

    return false;
}
