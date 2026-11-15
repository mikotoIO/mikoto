use std::{collections::HashMap, str::FromStr};

use bitflags::bitflags;

use crate::{
    entities::{MemberExt, SpaceExt},
    error::Error,
};

bitflags! {
    #[derive(Debug, Clone, Copy)]
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
    if space.base.owner_id == Some(member.user.base.id) {
        return Ok(());
    }
    let user_perms = collect_permissions(space, member);
    // Any one bypass bit is enough (e.g. ADMIN | MODERATOR), and an empty
    // bypass must not match: `contains(NONE)` is always true.
    if user_perms.intersects(bypass) || user_perms.contains(rule) {
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
    use uuid::Uuid;

    use super::*;
    use crate::entities::{Role, Space, SpaceType, SpaceUser, User, UserExt};

    fn role(space_id: Uuid, perms: &str) -> Role {
        Role {
            id: Uuid::new_v4(),
            space_id,
            name: "role".into(),
            color: None,
            permissions: perms.into(),
            position: 0,
        }
    }

    fn space(owner_id: Option<Uuid>, roles: Vec<Role>) -> SpaceExt {
        SpaceExt {
            base: Space {
                id: Uuid::new_v4(),
                name: "space".into(),
                icon: None,
                owner_id,
                space_type: SpaceType::None,
                visibility: None,
                accent: None,
            },
            handle: None,
            roles,
            channels: vec![],
            member_count: 0,
        }
    }

    fn member(space: &SpaceExt, role_ids: Vec<Uuid>) -> MemberExt {
        let user_id = Uuid::new_v4();
        MemberExt {
            base: SpaceUser::new(space.base.id, user_id),
            user: UserExt {
                base: User {
                    id: user_id,
                    name: "user".into(),
                    avatar: None,
                    description: None,
                    category: None,
                    space_order: vec![],
                },
                handle: None,
                space_order: None,
            },
            role_ids,
        }
    }

    fn bits(p: Permission) -> String {
        p.bits().to_string()
    }

    #[test]
    fn owner_bypasses_every_check() {
        let mut s = space(None, vec![]);
        let m = member(&s, vec![]);
        s.base.owner_id = Some(m.user.base.id);
        assert!(permissions(&s, &m, Permission::MANAGE_SPACE | Permission::BAN).is_ok());
    }

    #[test]
    fn member_without_roles_is_denied() {
        let s = space(Some(Uuid::new_v4()), vec![]);
        let m = member(&s, vec![]);
        let err = permissions(&s, &m, Permission::MANAGE_CHANNELS).unwrap_err();
        assert!(matches!(err, Error::InsufficientPermissions { .. }));
    }

    #[test]
    fn permissions_are_the_union_of_roles() {
        let mut s = space(None, vec![]);
        let a = role(s.base.id, &bits(Permission::MANAGE_CHANNELS));
        let b = role(s.base.id, &bits(Permission::BAN));
        let (a_id, b_id) = (a.id, b.id);
        s.roles = vec![a, b];
        let m = member(&s, vec![a_id, b_id]);

        assert!(permissions(&s, &m, Permission::MANAGE_CHANNELS).is_ok());
        assert!(permissions(&s, &m, Permission::BAN).is_ok());
        assert!(permissions(&s, &m, Permission::MANAGE_CHANNELS | Permission::BAN).is_ok());
        assert!(permissions(&s, &m, Permission::MANAGE_ROLES).is_err());
        // needs every bit of the rule, not just one
        assert!(permissions(
            &s,
            &m,
            Permission::MANAGE_CHANNELS | Permission::MANAGE_ROLES
        )
        .is_err());
    }

    #[test]
    fn only_the_members_own_roles_count() {
        let mut s = space(None, vec![]);
        let granted = role(s.base.id, &bits(Permission::MANAGE_SPACE));
        s.roles = vec![granted];
        let m = member(&s, vec![Uuid::new_v4()]); // role id not in the space
        assert!(permissions(&s, &m, Permission::MANAGE_SPACE).is_err());
    }

    #[test]
    fn malformed_role_permissions_are_ignored() {
        let mut s = space(None, vec![]);
        let bad = role(s.base.id, "not a number");
        let good = role(s.base.id, &bits(Permission::BAN));
        let ids = vec![bad.id, good.id];
        s.roles = vec![bad, good];
        let m = member(&s, ids);
        assert!(permissions(&s, &m, Permission::BAN).is_ok());
        assert!(permissions(&s, &m, Permission::MANAGE_SPACE).is_err());
    }

    #[test]
    fn unknown_bits_are_truncated() {
        let mut s = space(None, vec![]);
        let r = role(s.base.id, &(1u64 << 63).to_string());
        let id = r.id;
        s.roles = vec![r];
        let m = member(&s, vec![id]);
        assert!(permissions(&s, &m, Permission::ADMIN).is_err());
    }

    #[test]
    fn admin_bypass() {
        let mut s = space(None, vec![]);
        let admin = role(s.base.id, &bits(Permission::ADMIN));
        let id = admin.id;
        s.roles = vec![admin];
        let m = member(&s, vec![id]);

        assert!(permissions_or_admin(&s, &m, Permission::MANAGE_SPACE).is_ok());
        assert!(permissions_or_moderator(&s, &m, Permission::BAN).is_ok());
        // plain `permissions` has no bypass
        assert!(permissions(&s, &m, Permission::MANAGE_SPACE).is_err());
    }

    #[test]
    fn moderator_bypass_only_applies_to_moderator_checks() {
        let mut s = space(None, vec![]);
        let moderator = role(s.base.id, &bits(Permission::MODERATOR));
        let id = moderator.id;
        s.roles = vec![moderator];
        let m = member(&s, vec![id]);

        assert!(permissions_or_moderator(&s, &m, Permission::MANAGE_MESSAGES).is_ok());
        assert!(permissions_or_admin(&s, &m, Permission::MANAGE_MESSAGES).is_err());
    }

    #[test]
    fn moderator_bypass_does_not_need_admin_too() {
        // `ADMIN | MODERATOR` as a bypass must not require *both* bits.
        let mut s = space(None, vec![]);
        let r = role(s.base.id, &bits(Permission::MODERATOR));
        let id = r.id;
        s.roles = vec![r];
        let m = member(&s, vec![id]);
        assert!(permissions_or_moderator(&s, &m, Permission::BAN).is_ok());
    }
}
