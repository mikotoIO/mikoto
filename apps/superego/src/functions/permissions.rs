use std::{collections::HashMap, str::FromStr};

use bitflags::bitflags;

use crate::{
    entities::{MemberExt, SpaceExt},
    error::Error,
};

bitflags! {
    #[derive(Debug, Clone, Copy, PartialEq)]
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
                .and_then(|role| u64::from_str(&role.permissions).ok())
        })
        .collect();
    res.iter().fold(Permission::NONE, |acc, &x| {
        acc | Permission::from_bits_truncate(x)
    })
}

/// same as permissions, but people with specific permissions (admins, mods)
/// are granted all permissions (like owners)
pub fn permissions_with_bypass(
    space: &SpaceExt,
    member: &MemberExt,
    rule: Permission,
    bypass: Permission,
) -> Result<(), Error> {
    if space.base.owner_id == Some(member.user.id) {
        return Ok(());
    }
    let user_perms = collect_permissions(space, member);
    if (bypass != Permission::NONE && user_perms.intersects(bypass)) || user_perms.contains(rule) {
        Ok(())
    } else {
        Err(Error::InsufficientPermissions {
            message: format!("Expected {rule:?}, Got {user_perms:?}"),
        })
    }
}

/// Check if a user is allowed to perform an action.
/// Returns true if the user has the required permissions.
pub fn permissions(space: &SpaceExt, member: &MemberExt, rule: Permission) -> Result<(), Error> {
    // Owner bypasses all permission checks
    permissions_with_bypass(space, member, rule, Permission::NONE)
}

pub fn permissions_or_admin(
    space: &SpaceExt,
    member: &MemberExt,
    rule: Permission,
) -> Result<(), Error> {
    permissions_with_bypass(space, member, rule, Permission::ADMIN)
}

pub fn permissions_or_moderator(
    space: &SpaceExt,
    member: &MemberExt,
    rule: Permission,
) -> Result<(), Error> {
    permissions_with_bypass(
        space,
        member,
        rule,
        Permission::ADMIN | Permission::MODERATOR,
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::entities::{Role, Space, SpaceType, User};
    use uuid::Uuid;

    fn create_test_user(id: Uuid) -> User {
        User {
            id,
            name: "Test User".to_string(),
            avatar: None,
            description: None,
            category: None,
        }
    }

    fn create_test_space(owner_id: Option<Uuid>) -> SpaceExt {
        let space = Space {
            id: Uuid::new_v4(),
            name: "Test Space".to_string(),
            icon: None,
            owner_id,
            space_type: SpaceType::None,
        };

        SpaceExt {
            base: space,
            roles: vec![],
            channels: vec![],
        }
    }

    fn create_test_member(user_id: Uuid, space_id: Uuid, role_ids: Vec<Uuid>) -> MemberExt {
        let space_user = crate::entities::SpaceUser {
            id: Uuid::new_v4(),
            space_id,
            user_id,
            name: None,
        };

        MemberExt {
            base: space_user,
            user: create_test_user(user_id),
            role_ids,
        }
    }

    fn create_test_role(id: Uuid, space_id: Uuid, permissions: u64) -> Role {
        Role {
            id,
            space_id,
            name: "Test Role".to_string(),
            color: None,
            permissions: permissions.to_string(),
            position: 0,
        }
    }

    #[test]
    // Test that a member with no roles has no permissions
    fn test_collect_permissions_no_roles() {
        let space = create_test_space(None);
        let member = create_test_member(Uuid::new_v4(), space.base.id, vec![]);

        let result = collect_permissions(&space, &member);
        assert_eq!(result, Permission::NONE);
    }

    #[test]
    // Test that a member with a single role gets the permissions from that role
    fn test_collect_permissions_single_role() {
        let space_id = Uuid::new_v4();
        let role_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();

        let role = create_test_role(role_id, space_id, Permission::ADMIN.bits());
        let mut space = create_test_space(None);
        space.base.id = space_id;
        space.roles = vec![role];

        let member = create_test_member(user_id, space_id, vec![role_id]);

        let result = collect_permissions(&space, &member);
        assert_eq!(result, Permission::ADMIN);
    }

    #[test]
    // Test that a member with multiple roles gets combined permissions from all roles
    fn test_collect_permissions_multiple_roles() {
        let space_id = Uuid::new_v4();
        let role1_id = Uuid::new_v4();
        let role2_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();

        let role1 = create_test_role(role1_id, space_id, Permission::ADMIN.bits());
        let role2 = create_test_role(role2_id, space_id, Permission::MANAGE_CHANNELS.bits());

        let mut space = create_test_space(None);
        space.base.id = space_id;
        space.roles = vec![role1, role2];

        let member = create_test_member(user_id, space_id, vec![role1_id, role2_id]);

        let result = collect_permissions(&space, &member);
        let expected = Permission::ADMIN | Permission::MANAGE_CHANNELS;
        assert_eq!(result, expected);
    }

    #[test]
    // Test that referencing a role ID that doesn't exist in the space results in no permissions
    fn test_collect_permissions_invalid_role_id() {
        let space_id = Uuid::new_v4();
        let role_id = Uuid::new_v4();
        let invalid_role_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();

        let role = create_test_role(role_id, space_id, Permission::ADMIN.bits());
        let mut space = create_test_space(None);
        space.base.id = space_id;
        space.roles = vec![role];

        let member = create_test_member(user_id, space_id, vec![invalid_role_id]);

        let result = collect_permissions(&space, &member);
        assert_eq!(result, Permission::NONE);
    }

    #[test]
    // Test that roles with invalid permission strings (non-numeric) are ignored and result in no permissions
    fn test_collect_permissions_invalid_permission_string() {
        let space_id = Uuid::new_v4();
        let role_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();

        let mut role = create_test_role(role_id, space_id, 0);
        role.permissions = "invalid_number".to_string();

        let mut space = create_test_space(None);
        space.base.id = space_id;
        space.roles = vec![role];

        let member = create_test_member(user_id, space_id, vec![role_id]);

        let result = collect_permissions(&space, &member);
        assert_eq!(result, Permission::NONE);
    }

    #[test]
    // Test that space owners bypass all permission checks regardless of their roles
    fn test_permissions_owner_bypass() {
        let owner_id = Uuid::new_v4();
        let space = create_test_space(Some(owner_id));
        let member = create_test_member(owner_id, space.base.id, vec![]);

        let result = permissions(&space, &member, Permission::ADMIN);
        assert!(result.is_ok());
    }

    #[test]
    // Test that non-owners with the required permission can pass permission checks
    fn test_permissions_non_owner_with_permission() {
        let owner_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();
        let role_id = Uuid::new_v4();

        let role = create_test_role(role_id, Uuid::new_v4(), Permission::MANAGE_CHANNELS.bits());
        let mut space = create_test_space(Some(owner_id));
        space.roles = vec![role];

        let member = create_test_member(user_id, space.base.id, vec![role_id]);

        let result = permissions(&space, &member, Permission::MANAGE_CHANNELS);
        assert!(result.is_ok());
    }

    #[test]
    // Test that non-owners without the required permission fail permission checks with proper error
    fn test_permissions_non_owner_without_permission() {
        let owner_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();
        // Ensure user_id is different from owner_id
        assert_ne!(owner_id, user_id);

        let space = create_test_space(Some(owner_id));
        let member = create_test_member(user_id, space.base.id, vec![]);

        let result = permissions(&space, &member, Permission::ADMIN);
        assert!(result.is_err());

        if let Err(Error::InsufficientPermissions { message }) = result {
            assert!(message.contains("Expected"));
            assert!(message.contains("Got"));
        } else {
            panic!("Expected InsufficientPermissions error");
        }
    }

    #[test]
    // Test that users with admin permission can bypass specific permission requirements
    fn test_permissions_or_admin_with_admin() {
        let user_id = Uuid::new_v4();
        let role_id = Uuid::new_v4();

        let role = create_test_role(role_id, Uuid::new_v4(), Permission::ADMIN.bits());
        let mut space = create_test_space(None);
        space.roles = vec![role];

        let member = create_test_member(user_id, space.base.id, vec![role_id]);

        let result = permissions_or_admin(&space, &member, Permission::MANAGE_CHANNELS);
        assert!(result.is_ok());
    }

    #[test]
    // Test that users with the exact required permission pass admin-or-permission checks
    fn test_permissions_or_admin_with_specific_permission() {
        let user_id = Uuid::new_v4();
        let role_id = Uuid::new_v4();

        let role = create_test_role(role_id, Uuid::new_v4(), Permission::MANAGE_CHANNELS.bits());
        let mut space = create_test_space(None);
        space.roles = vec![role];

        let member = create_test_member(user_id, space.base.id, vec![role_id]);

        let result = permissions_or_admin(&space, &member, Permission::MANAGE_CHANNELS);
        assert!(result.is_ok());
    }

    #[test]
    // Test that users without admin or the specific permission fail admin-or-permission checks
    fn test_permissions_or_admin_without_permission() {
        let user_id = Uuid::new_v4();
        let role_id = Uuid::new_v4();

        let role = create_test_role(role_id, Uuid::new_v4(), Permission::MANAGE_CHANNELS.bits());
        let mut space = create_test_space(None);
        space.roles = vec![role];

        let member = create_test_member(user_id, space.base.id, vec![role_id]);

        let result = permissions_or_admin(&space, &member, Permission::BAN);
        assert!(result.is_err());
    }

    #[test]
    // Test that users with admin permission can bypass moderator-or-permission checks
    fn test_permissions_or_moderator_with_admin() {
        let user_id = Uuid::new_v4();
        let role_id = Uuid::new_v4();

        let role = create_test_role(role_id, Uuid::new_v4(), Permission::ADMIN.bits());
        let mut space = create_test_space(None);
        space.roles = vec![role];

        let member = create_test_member(user_id, space.base.id, vec![role_id]);

        let result = permissions_or_moderator(&space, &member, Permission::MANAGE_MESSAGES);
        assert!(result.is_ok());
    }

    #[test]
    // Test that users with moderator permission can bypass specific permission requirements
    fn test_permissions_or_moderator_with_moderator() {
        let user_id = Uuid::new_v4();
        let role_id = Uuid::new_v4();

        let role = create_test_role(role_id, Uuid::new_v4(), Permission::MODERATOR.bits());
        let mut space = create_test_space(None);
        space.roles = vec![role];

        let member = create_test_member(user_id, space.base.id, vec![role_id]);

        let result = permissions_or_moderator(&space, &member, Permission::MANAGE_MESSAGES);
        assert!(result.is_ok());
    }

    #[test]
    // Test that users with the exact required permission pass moderator-or-permission checks
    fn test_permissions_or_moderator_with_specific_permission() {
        let user_id = Uuid::new_v4();
        let role_id = Uuid::new_v4();

        let role = create_test_role(role_id, Uuid::new_v4(), Permission::MANAGE_MESSAGES.bits());
        let mut space = create_test_space(None);
        space.roles = vec![role];

        let member = create_test_member(user_id, space.base.id, vec![role_id]);

        let result = permissions_or_moderator(&space, &member, Permission::MANAGE_MESSAGES);
        assert!(result.is_ok());
    }

    #[test]
    // Test that users without admin, moderator, or specific permission fail moderator-or-permission checks
    fn test_permissions_or_moderator_without_permission() {
        let user_id = Uuid::new_v4();

        let space = create_test_space(None);
        let member = create_test_member(user_id, space.base.id, vec![]);

        let result = permissions_or_moderator(&space, &member, Permission::MANAGE_MESSAGES);
        assert!(result.is_err());
    }

    #[test]
    // Test that space owners always pass permission checks regardless of bypass settings
    fn test_permissions_with_bypass_owner_always_passes() {
        let owner_id = Uuid::new_v4();
        let space = create_test_space(Some(owner_id));
        let member = create_test_member(owner_id, space.base.id, vec![]);

        let result =
            permissions_with_bypass(&space, &member, Permission::ADMIN, Permission::MODERATOR);
        assert!(result.is_ok());
    }

    #[test]
    // Test that users with bypass permission can access actions they don't have specific permission for
    fn test_permissions_with_bypass_passes_with_bypass_permission() {
        let user_id = Uuid::new_v4();
        let role_id = Uuid::new_v4();

        let role = create_test_role(role_id, Uuid::new_v4(), Permission::MODERATOR.bits());
        let mut space = create_test_space(None);
        space.roles = vec![role];

        let member = create_test_member(user_id, space.base.id, vec![role_id]);

        let result =
            permissions_with_bypass(&space, &member, Permission::ADMIN, Permission::MODERATOR);
        assert!(result.is_ok());
    }

    #[test]
    // Test that users with the exact required permission pass bypass permission checks
    fn test_permissions_with_bypass_passes_with_required_permission() {
        let user_id = Uuid::new_v4();
        let role_id = Uuid::new_v4();

        let role = create_test_role(role_id, Uuid::new_v4(), Permission::ADMIN.bits());
        let mut space = create_test_space(None);
        space.roles = vec![role];

        let member = create_test_member(user_id, space.base.id, vec![role_id]);

        let result =
            permissions_with_bypass(&space, &member, Permission::ADMIN, Permission::MODERATOR);
        assert!(result.is_ok());
    }

    #[test]
    // Test that users without required permission or bypass permission fail permission checks
    fn test_permissions_with_bypass_fails_without_any_permission() {
        let user_id = Uuid::new_v4();

        let space = create_test_space(None);
        let member = create_test_member(user_id, space.base.id, vec![]);

        let result =
            permissions_with_bypass(&space, &member, Permission::ADMIN, Permission::MODERATOR);
        assert!(result.is_err());
    }

    #[test]
    // Test complex scenarios with multiple roles and various permission combinations
    fn test_complex_permission_combinations() {
        let user_id = Uuid::new_v4();
        let role1_id = Uuid::new_v4();
        let role2_id = Uuid::new_v4();
        let role3_id = Uuid::new_v4();

        let role1 = create_test_role(
            role1_id,
            Uuid::new_v4(),
            (Permission::MANAGE_CHANNELS | Permission::MANAGE_ROLES).bits(),
        );
        let role2 = create_test_role(role2_id, Uuid::new_v4(), Permission::MANAGE_INVITES.bits());
        let role3 = create_test_role(role3_id, Uuid::new_v4(), Permission::BAN.bits());

        let mut space = create_test_space(None);
        space.roles = vec![role1, role2, role3];

        let member = create_test_member(user_id, space.base.id, vec![role1_id, role2_id, role3_id]);

        let user_perms = collect_permissions(&space, &member);
        assert!(user_perms.contains(Permission::MANAGE_CHANNELS));
        assert!(user_perms.contains(Permission::MANAGE_ROLES));
        assert!(user_perms.contains(Permission::MANAGE_INVITES));
        assert!(user_perms.contains(Permission::BAN));
        assert!(!user_perms.contains(Permission::ADMIN));
        assert!(!user_perms.contains(Permission::MODERATOR));

        assert!(permissions(&space, &member, Permission::MANAGE_CHANNELS).is_ok());
        assert!(permissions(&space, &member, Permission::BAN).is_ok());
        assert!(permissions(&space, &member, Permission::ADMIN).is_err());
    }
}
