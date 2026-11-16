use std::collections::{BTreeSet, HashMap};

use bitflags::bitflags;

use crate::{
    entities::{MemberExt, SpaceExt},
    error::Error,
};

bitflags! {
    /// The built-in permissions, as bits for fast checks. Bits are an
    /// in-memory detail only: roles store and send permissions by name (see
    /// [`BUILTIN_NAMES`]), so the bit layout can change freely.
    #[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
    pub struct Permission: u64 {
        const NONE = 0;
        /// Every permission, built-in or custom. Named `superuser`.
        const ADMIN = 1 << 0;

        const MANAGE_SPACE = 1 << 1;
        const MANAGE_CHANNELS = 1 << 2;
        const MANAGE_ROLES = 1 << 3;
        const ASSIGN_ROLES = 1 << 4;
        const MANAGE_MEMBER_PROFILES = 1 << 5;
        const MANAGE_INVITES = 1 << 6;
        const MANAGE_EMOJIS = 1 << 7;
        const MANAGE_MESSAGES = 1 << 8;
        const MANAGE_BOTS = 1 << 9;
        const BAN = 1 << 10;

        const READ_CHANNEL = 1 << 11;
        const SEND_IN_CHANNEL = 1 << 12;
        const CREATE_SUB_CHANNELS = 1 << 13;
        const MANAGE_SUB_CHANNELS = 1 << 14;

        /// Bypasses checks that moderators may skip (messages, invites).
        const MODERATOR = 1 << 15;
    }
}

/// The name each built-in permission is stored and sent as. These names are
/// the API contract, shared with the client (`packages/permcheck`; a test
/// below checks the two match): never rename or reuse one. The order here is
/// the canonical order roles list their permissions in.
pub const BUILTIN_NAMES: &[(Permission, &str)] = &[
    (Permission::ADMIN, "superuser"),
    (Permission::MANAGE_SPACE, "manage_space"),
    (Permission::MANAGE_CHANNELS, "manage_channels"),
    (Permission::MANAGE_ROLES, "manage_roles"),
    (Permission::ASSIGN_ROLES, "assign_roles"),
    (Permission::MANAGE_MEMBER_PROFILES, "manage_member_profiles"),
    (Permission::MANAGE_INVITES, "manage_invites"),
    (Permission::MANAGE_EMOJIS, "manage_emojis"),
    (Permission::MANAGE_MESSAGES, "manage_messages"),
    (Permission::MANAGE_BOTS, "manage_bots"),
    (Permission::BAN, "ban"),
    (Permission::READ_CHANNEL, "read_channel"),
    (Permission::SEND_IN_CHANNEL, "send_in_channel"),
    (Permission::CREATE_SUB_CHANNELS, "create_sub_channels"),
    (Permission::MANAGE_SUB_CHANNELS, "manage_sub_channels"),
    (Permission::MODERATOR, "moderator"),
];

/// Longest permission name a role may hold.
pub const MAX_NAME_LEN: usize = 64;
/// Most permissions a single role may hold.
pub const MAX_PERMISSIONS_PER_ROLE: usize = 128;

impl Permission {
    /// The built-in permission called `name`, if there is one.
    pub fn by_name(name: &str) -> Option<Self> {
        BUILTIN_NAMES
            .iter()
            .find(|(_, n)| *n == name)
            .map(|(p, _)| *p)
    }
}

/// Whether `name` is a custom permission: `<namespace>:<name>`, where both
/// parts are non-empty lowercase ASCII letters, digits, `_`, `-` or `.`, e.g.
/// `polls:create`. Extensions define these; the namespace keeps them apart
/// from each other and from the built-ins.
pub fn is_custom_name(name: &str) -> bool {
    let part_ok = |s: &str| {
        !s.is_empty()
            && s.bytes().all(|b| {
                b.is_ascii_lowercase() || b.is_ascii_digit() || matches!(b, b'_' | b'-' | b'.')
            })
    };
    name.len() <= MAX_NAME_LEN
        && name
            .split_once(':')
            .is_some_and(|(ns, rest)| part_ok(ns) && part_ok(rest))
}

/// A set of permissions: built-ins as bits, custom (extension-defined)
/// permissions by name.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct PermissionSet {
    pub builtin: Permission,
    pub custom: BTreeSet<String>,
}

impl From<Permission> for PermissionSet {
    fn from(builtin: Permission) -> Self {
        Self {
            builtin,
            custom: BTreeSet::new(),
        }
    }
}

impl PermissionSet {
    /// Read stored names, skipping any that aren't known. A name this
    /// version doesn't know (e.g. a built-in added by a newer server) grants
    /// nothing, rather than failing the whole check.
    pub fn from_names<S: AsRef<str>>(names: &[S]) -> Self {
        let mut set = Self::default();
        for name in names {
            let name = name.as_ref();
            if let Some(p) = Permission::by_name(name) {
                set.builtin |= p;
            } else if is_custom_name(name) {
                set.custom.insert(name.to_string());
            }
        }
        set
    }

    /// Parse names sent by a client, rejecting any that are neither a
    /// built-in nor a well-formed custom name, so typos don't get stored.
    pub fn parse<S: AsRef<str>>(names: &[S]) -> Result<Self, Error> {
        let invalid = |message: String| {
            Error::new(
                "InvalidPermissions",
                axum::http::StatusCode::BAD_REQUEST,
                &message,
            )
        };
        if names.len() > MAX_PERMISSIONS_PER_ROLE {
            return Err(invalid(format!(
                "A role can hold at most {MAX_PERMISSIONS_PER_ROLE} permissions"
            )));
        }
        if let Some(bad) = names
            .iter()
            .map(AsRef::as_ref)
            .find(|name| Permission::by_name(name).is_none() && !is_custom_name(name))
        {
            return Err(invalid(format!(
                "Unknown permission {bad:?}. Custom permissions look like \"namespace:name\""
            )));
        }
        Ok(Self::from_names(names))
    }

    /// The canonical list of names: built-ins in [`BUILTIN_NAMES`] order,
    /// then custom permissions sorted.
    pub fn to_names(&self) -> Vec<String> {
        BUILTIN_NAMES
            .iter()
            .filter(|(p, _)| self.builtin.contains(*p))
            .map(|(_, n)| n.to_string())
            .chain(self.custom.iter().cloned())
            .collect()
    }

    pub fn is_empty(&self) -> bool {
        self.builtin.is_empty() && self.custom.is_empty()
    }

    pub fn union(mut self, other: &Self) -> Self {
        self.builtin |= other.builtin;
        self.custom.extend(other.custom.iter().cloned());
        self
    }

    /// Whether every permission in `other` is also in `self`.
    pub fn contains(&self, other: &Self) -> bool {
        self.builtin.contains(other.builtin) && other.custom.is_subset(&self.custom)
    }

    /// The permissions in `self` that aren't in `other`.
    pub fn difference(&self, other: &Self) -> Self {
        Self {
            builtin: self.builtin.difference(other.builtin),
            custom: self.custom.difference(&other.custom).cloned().collect(),
        }
    }
}

/// Everything `member` holds through their roles. Doesn't account for
/// ownership: owners pass every check regardless.
pub fn collect_permissions(space: &SpaceExt, member: &MemberExt) -> PermissionSet {
    let role_map: HashMap<_, _> = space.roles.iter().map(|role| (role.id, role)).collect();
    member
        .role_ids
        .iter()
        .filter_map(|role_id| role_map.get(role_id))
        .fold(PermissionSet::default(), |acc, role| {
            acc.union(&PermissionSet::from_names(&role.permissions))
        })
}

/// Whether `member` may hand out (or take away) `granted`, e.g. by editing a
/// role or assigning one. Owners and superusers may grant anything; everyone
/// else only permissions they hold themselves, so a role manager can't create
/// a superuser role and give it to themselves.
pub fn can_grant(
    space: &SpaceExt,
    member: &MemberExt,
    granted: &PermissionSet,
) -> Result<(), Error> {
    if space.base.owner_id == Some(member.user.base.id) {
        return Ok(());
    }
    let user_perms = collect_permissions(space, member);
    if user_perms.builtin.contains(Permission::ADMIN) || user_perms.contains(granted) {
        Ok(())
    } else {
        Err(Error::InsufficientPermissions {
            message: format!(
                "You can't grant permissions you don't have: {:?}",
                granted.difference(&user_perms).to_names()
            ),
        })
    }
}

/// Whether `member` holds the custom permission `name`. Owners and
/// superusers hold every custom permission.
pub fn custom_permission(space: &SpaceExt, member: &MemberExt, name: &str) -> Result<(), Error> {
    if space.base.owner_id == Some(member.user.base.id) {
        return Ok(());
    }
    let user_perms = collect_permissions(space, member);
    if user_perms.builtin.contains(Permission::ADMIN) || user_perms.custom.contains(name) {
        Ok(())
    } else {
        Err(Error::InsufficientPermissions {
            message: format!("Expected {name:?}"),
        })
    }
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
    let user_perms = collect_permissions(space, member).builtin;
    // Any one bypass bit is enough (e.g. ADMIN | MODERATOR), and an empty
    // bypass must not match: `contains(NONE)` is always true.
    if user_perms.intersects(bypass) || user_perms.contains(rule) {
        Ok(())
    } else {
        Err(Error::InsufficientPermissions {
            message: format!(
                "Expected {:?}, Got {:?}",
                PermissionSet::from(rule).to_names(),
                PermissionSet::from(user_perms).to_names()
            ),
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

    fn role(space_id: Uuid, perms: &[&str]) -> Role {
        Role {
            id: Uuid::new_v4(),
            space_id,
            name: "role".into(),
            color: None,
            permissions: perms.iter().map(|s| s.to_string()).collect(),
            position: 0,
        }
    }

    fn names(p: Permission) -> Vec<String> {
        PermissionSet::from(p).to_names()
    }

    fn role_with(space_id: Uuid, p: Permission) -> Role {
        let mut r = role(space_id, &[]);
        r.permissions = names(p);
        r
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

    /// A space whose only role holds `perms`, and a member with that role.
    fn holding(perms: &[&str]) -> (SpaceExt, MemberExt) {
        let mut s = space(None, vec![]);
        let r = role(s.base.id, perms);
        let id = r.id;
        s.roles = vec![r];
        let m = member(&s, vec![id]);
        (s, m)
    }

    fn set(perms: &[&str]) -> PermissionSet {
        PermissionSet::parse(perms).unwrap()
    }

    #[test]
    fn every_builtin_has_one_unique_name() {
        let mut seen = std::collections::HashSet::new();
        let mut all = Permission::NONE;
        for (p, name) in BUILTIN_NAMES {
            assert_eq!(p.bits().count_ones(), 1, "{name}");
            assert!(seen.insert(*name), "duplicate name {name}");
            assert!(!all.intersects(*p), "duplicate bit for {name}");
            assert!(!is_custom_name(name), "{name} looks custom");
            all |= *p;
        }
        assert_eq!(all, Permission::all(), "a built-in has no name");
    }

    #[test]
    fn owner_bypasses_every_check() {
        let mut s = space(None, vec![]);
        let m = member(&s, vec![]);
        s.base.owner_id = Some(m.user.base.id);
        assert!(permissions(&s, &m, Permission::MANAGE_SPACE | Permission::BAN).is_ok());
        assert!(custom_permission(&s, &m, "polls:create").is_ok());
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
        let a = role(s.base.id, &["manage_channels", "polls:create"]);
        let b = role(s.base.id, &["ban", "polls:close"]);
        let (a_id, b_id) = (a.id, b.id);
        s.roles = vec![a, b];
        let m = member(&s, vec![a_id, b_id]);

        assert!(permissions(&s, &m, Permission::MANAGE_CHANNELS).is_ok());
        assert!(permissions(&s, &m, Permission::BAN).is_ok());
        assert!(permissions(&s, &m, Permission::MANAGE_CHANNELS | Permission::BAN).is_ok());
        assert!(permissions(&s, &m, Permission::MANAGE_ROLES).is_err());
        // needs every permission of the rule, not just one
        assert!(permissions(
            &s,
            &m,
            Permission::MANAGE_CHANNELS | Permission::MANAGE_ROLES
        )
        .is_err());
        assert!(custom_permission(&s, &m, "polls:create").is_ok());
        assert!(custom_permission(&s, &m, "polls:close").is_ok());
        assert!(custom_permission(&s, &m, "polls:delete").is_err());
    }

    #[test]
    fn only_the_members_own_roles_count() {
        let mut s = space(None, vec![]);
        let granted = role_with(s.base.id, Permission::MANAGE_SPACE);
        s.roles = vec![granted];
        let m = member(&s, vec![Uuid::new_v4()]); // role id not in the space
        assert!(permissions(&s, &m, Permission::MANAGE_SPACE).is_err());
    }

    #[test]
    fn unknown_stored_names_grant_nothing() {
        // e.g. written by a newer server that has since been rolled back
        let (s, m) = holding(&["ban", "fly", "Polls:Create", ""]);
        assert!(permissions(&s, &m, Permission::BAN).is_ok());
        let held = collect_permissions(&s, &m);
        assert_eq!(held, PermissionSet::from(Permission::BAN));
    }

    #[test]
    fn superuser_bypass() {
        let (s, m) = holding(&["superuser"]);
        assert!(permissions_or_admin(&s, &m, Permission::MANAGE_SPACE).is_ok());
        assert!(permissions_or_moderator(&s, &m, Permission::BAN).is_ok());
        assert!(custom_permission(&s, &m, "polls:create").is_ok());
        // plain `permissions` has no bypass
        assert!(permissions(&s, &m, Permission::MANAGE_SPACE).is_err());
    }

    #[test]
    fn moderator_bypass_only_applies_to_moderator_checks() {
        let (s, m) = holding(&["moderator"]);
        assert!(permissions_or_moderator(&s, &m, Permission::MANAGE_MESSAGES).is_ok());
        assert!(permissions_or_admin(&s, &m, Permission::MANAGE_MESSAGES).is_err());
        assert!(custom_permission(&s, &m, "polls:create").is_err());
    }

    #[test]
    fn moderator_bypass_does_not_need_admin_too() {
        // `ADMIN | MODERATOR` as a bypass must not require *both* bits.
        let (s, m) = holding(&["moderator"]);
        assert!(permissions_or_moderator(&s, &m, Permission::BAN).is_ok());
    }

    #[test]
    fn can_grant_only_what_you_hold() {
        let (s, m) = holding(&["manage_roles", "manage_channels", "polls:create"]);

        assert!(can_grant(&s, &m, &set(&["manage_channels"])).is_ok());
        assert!(can_grant(&s, &m, &set(&["polls:create", "manage_roles"])).is_ok());
        assert!(can_grant(&s, &m, &PermissionSet::default()).is_ok());
        assert!(can_grant(&s, &m, &set(&["superuser"])).is_err());
        assert!(can_grant(&s, &m, &set(&["manage_channels", "ban"])).is_err());
        assert!(can_grant(&s, &m, &set(&["polls:close"])).is_err());
    }

    #[test]
    fn owners_and_superusers_can_grant_anything() {
        let everything = PermissionSet::from(Permission::all()).union(&set(&["polls:create"]));

        let (mut s, a) = holding(&["superuser"]);
        assert!(can_grant(&s, &a, &everything).is_ok());

        let o = member(&s, vec![]);
        s.base.owner_id = Some(o.user.base.id);
        assert!(can_grant(&s, &o, &everything).is_ok());
    }

    #[test]
    fn parses_permission_names() {
        assert_eq!(set(&[]), PermissionSet::default());
        assert_eq!(
            set(&["ban", "superuser", "ban"]).builtin,
            Permission::BAN | Permission::ADMIN
        );
        assert_eq!(
            set(&["polls:create"]).custom,
            BTreeSet::from(["polls:create".to_string()])
        );
        for bad in [
            "", "Ban", "fly", "1024", ":x", "x:", "a b:c", "UP:per", "a:b:c ",
        ] {
            assert!(PermissionSet::parse(&[bad]).is_err(), "{bad:?}");
        }
        assert!(PermissionSet::parse(&[format!("x:{}", "y".repeat(MAX_NAME_LEN))]).is_err());
        let many: Vec<String> = (0..=MAX_PERMISSIONS_PER_ROLE)
            .map(|i| format!("x:{i}"))
            .collect();
        assert!(PermissionSet::parse(&many).is_err());
    }

    #[test]
    fn custom_names() {
        for good in ["polls:create", "my-ext.v2:do_thing", "a:b"] {
            assert!(is_custom_name(good), "{good:?}");
        }
        for bad in [
            "polls",
            "polls:",
            ":create",
            "Polls:create",
            "polls:cre ate",
            "a:b:c",
        ] {
            assert!(!is_custom_name(bad), "{bad:?}");
        }
    }

    #[test]
    fn names_are_canonical() {
        let names = set(&["zz:b", "ban", "aa:a", "superuser", "ban"]).to_names();
        assert_eq!(names, ["superuser", "ban", "aa:a", "zz:b"]);
    }

    /// The client's permcheck package lists the built-in names too; they
    /// must agree with the server's.
    #[test]
    fn matches_the_client_permission_names() {
        let ts = include_str!("../../../../packages/permcheck/src/index.ts");
        let block = ts
            .split_once("export const permissions = {")
            .and_then(|(_, rest)| rest.split_once("} as const"))
            .map(|(block, _)| block)
            .expect("couldn't find permcheck's permission list");
        let re = regex::Regex::new(r"(?m)^\s*\w+:\s*'([^']+)'").unwrap();
        let client: BTreeSet<&str> = re
            .captures_iter(block)
            .map(|c| c.get(1).unwrap().as_str())
            .collect();
        let server: BTreeSet<&str> = BUILTIN_NAMES.iter().map(|(_, n)| *n).collect();
        assert_eq!(server, client);
    }
}
