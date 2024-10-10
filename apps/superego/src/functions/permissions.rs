use std::{collections::HashMap, str::FromStr};

use bitflags::bitflags;

use crate::entities::{MemberExt, SpaceExt};

bitflags! {
    pub struct Permission: u64 {
        const NONE = 0;
        const ADMIN = 1 << 0;
        const MODERATOR = 1 << 1;

        const MANAGE_SPACE = 1 << 2;
        const MANAGE_CHANNELS = 1 << 3;
        const MANAGE_ROLES = 1 << 4;
        const ASSIGN_ROLES = 1 << 5;
        const MANAGE_MEMBER_PROFILES = 1 << 6;
        const MANAGE_INVITES = 1 << 7;
        const MANAGE_EMOJIS = 1 << 8;
        const MANAGE_MESSAGES = 1 << 9;
        const MANAGE_BOTS = 1 << 10;
        const BAN = 1 << 11;
    }
}

fn collect_permissions(space: &SpaceExt, member: &MemberExt) -> Permission {
    // collect the roles into a hashmap by id

    let role_map: HashMap<_, _> = space.roles.iter().map(|role| (role.id, role)).collect();
    let res: Vec<u64> = member
        .role_ids
        .iter()
        .filter_map(|role_id| {
            role_map
                .get(role_id)
                .map(|role| u64::from_str(&role.permissions).ok())
                .flatten()
        })
        .collect();
    res.iter().fold(Permission::NONE, |acc, &x| {
        acc | Permission::from_bits_truncate(x)
    })
}

/// Check if a user is allowed to perform an action.
/// Returns true if the user has the required permissions.
pub fn permissions(space: &SpaceExt, member: &MemberExt, rule: Permission) -> bool {
    // Owner bypasses all permission checks
    permissions_with_bypass(space, member, rule, Permission::NONE)
}

/// same as permissions, but people with specific permissions (admins, mods)
/// are granted all permissions (like owners)
pub fn permissions_with_bypass(
    space: &SpaceExt,
    member: &MemberExt,
    rule: Permission,
    bypass: Permission,
) -> bool {
    if space.base.owner_id == Some(member.user.id) {
        return true;
    }
    let user_perms = collect_permissions(&space, &member);
    user_perms.contains(bypass) || user_perms.contains(rule)
}
