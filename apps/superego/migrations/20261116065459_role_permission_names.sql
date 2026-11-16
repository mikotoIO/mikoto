-- Role permissions move from a decimal bitset string to a list of names:
-- built-ins like 'manage_channels', and custom 'namespace:name' permissions.
-- Bit n of the old value becomes the n-th name below (permcheck's old layout).
-- Malformed values granted nothing before, and become an empty list.

ALTER TABLE "Role" ADD COLUMN "permissionNames" text[] NOT NULL DEFAULT '{}';

UPDATE "Role" r
SET "permissionNames" = coalesce(
    (
        SELECT array_agg(n.name ORDER BY n.bit)
        FROM (VALUES
            (0, 'superuser'),
            (1, 'manage_space'),
            (2, 'manage_channels'),
            (3, 'manage_roles'),
            (4, 'assign_roles'),
            (5, 'manage_member_profiles'),
            (6, 'manage_invites'),
            (7, 'manage_emojis'),
            (8, 'manage_messages'),
            (9, 'manage_bots'),
            (10, 'ban'),
            (11, 'read_channel'),
            (12, 'send_in_channel'),
            (13, 'create_sub_channels'),
            (14, 'manage_sub_channels'),
            (15, 'moderator')
        ) AS n(bit, name)
        WHERE mod(floor(r."permissions"::numeric / power(2::numeric, n.bit)), 2) = 1
    ),
    '{}'
)
WHERE r."permissions" ~ '^[0-9]{1,40}$';

ALTER TABLE "Role" DROP COLUMN "permissions";
ALTER TABLE "Role" RENAME COLUMN "permissionNames" TO "permissions";
