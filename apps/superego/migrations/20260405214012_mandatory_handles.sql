-- Backfill handles for users who don't have one
-- Uses sanitized name with UUID-based discriminators on conflict
DO $$
DECLARE
    r RECORD;
    base_handle TEXT;
    id_hex TEXT;
    done BOOLEAN;
BEGIN
    FOR r IN
        SELECT u.id, u.name
        FROM "User" u
        WHERE NOT EXISTS (SELECT 1 FROM "Handle" h WHERE h."userId" = u.id)
    LOOP
        -- Sanitize: lowercase, replace invalid chars with hyphen, trim
        base_handle := LOWER(r.name);
        base_handle := REGEXP_REPLACE(base_handle, '[^a-z0-9_-]', '-', 'g');
        base_handle := TRIM(BOTH '-' FROM TRIM(BOTH '_' FROM base_handle));
        IF LENGTH(base_handle) < 2 THEN
            base_handle := 'user';
        END IF;
        IF LENGTH(base_handle) > 60 THEN
            base_handle := RTRIM(RTRIM(LEFT(base_handle, 60), '-'), '_');
        END IF;

        id_hex := REPLACE(r.id::text, '-', '');
        done := FALSE;

        -- Try base handle
        BEGIN
            INSERT INTO "Handle" (handle, "userId")
            VALUES (base_handle || '.platform.mikoto.io', r.id);
            done := TRUE;
        EXCEPTION WHEN unique_violation THEN NULL;
        END;

        -- Try with progressively longer discriminators
        IF NOT done THEN
            BEGIN
                INSERT INTO "Handle" (handle, "userId")
                VALUES (base_handle || '-' || LEFT(id_hex, 3) || '.platform.mikoto.io', r.id);
                done := TRUE;
            EXCEPTION WHEN unique_violation THEN NULL;
            END;
        END IF;

        IF NOT done THEN
            BEGIN
                INSERT INTO "Handle" (handle, "userId")
                VALUES (base_handle || '-' || LEFT(id_hex, 4) || '.platform.mikoto.io', r.id);
                done := TRUE;
            EXCEPTION WHEN unique_violation THEN NULL;
            END;
        END IF;

        IF NOT done THEN
            BEGIN
                INSERT INTO "Handle" (handle, "userId")
                VALUES (base_handle || '-' || LEFT(id_hex, 6) || '.platform.mikoto.io', r.id);
                done := TRUE;
            EXCEPTION WHEN unique_violation THEN NULL;
            END;
        END IF;

        IF NOT done THEN
            INSERT INTO "Handle" (handle, "userId")
            VALUES (base_handle || '-' || LEFT(id_hex, 12) || '.platform.mikoto.io', r.id);
        END IF;
    END LOOP;
END $$;

-- Backfill handles for regular spaces (not DM/GROUP) that don't have one
DO $$
DECLARE
    r RECORD;
    base_handle TEXT;
    id_hex TEXT;
    done BOOLEAN;
BEGIN
    FOR r IN
        SELECT s.id, s.name
        FROM "Space" s
        WHERE s.type = 'NONE'
          AND NOT EXISTS (SELECT 1 FROM "Handle" h WHERE h."spaceId" = s.id)
    LOOP
        base_handle := LOWER(r.name);
        base_handle := REGEXP_REPLACE(base_handle, '[^a-z0-9_-]', '-', 'g');
        base_handle := TRIM(BOTH '-' FROM TRIM(BOTH '_' FROM base_handle));
        IF LENGTH(base_handle) < 2 THEN
            base_handle := 'space';
        END IF;
        IF LENGTH(base_handle) > 60 THEN
            base_handle := RTRIM(RTRIM(LEFT(base_handle, 60), '-'), '_');
        END IF;

        id_hex := REPLACE(r.id::text, '-', '');
        done := FALSE;

        BEGIN
            INSERT INTO "Handle" (handle, "spaceId")
            VALUES (base_handle || '.platform.mikoto.io', r.id);
            done := TRUE;
        EXCEPTION WHEN unique_violation THEN NULL;
        END;

        IF NOT done THEN
            BEGIN
                INSERT INTO "Handle" (handle, "spaceId")
                VALUES (base_handle || '-' || LEFT(id_hex, 3) || '.platform.mikoto.io', r.id);
                done := TRUE;
            EXCEPTION WHEN unique_violation THEN NULL;
            END;
        END IF;

        IF NOT done THEN
            BEGIN
                INSERT INTO "Handle" (handle, "spaceId")
                VALUES (base_handle || '-' || LEFT(id_hex, 4) || '.platform.mikoto.io', r.id);
                done := TRUE;
            EXCEPTION WHEN unique_violation THEN NULL;
            END;
        END IF;

        IF NOT done THEN
            BEGIN
                INSERT INTO "Handle" (handle, "spaceId")
                VALUES (base_handle || '-' || LEFT(id_hex, 6) || '.platform.mikoto.io', r.id);
                done := TRUE;
            EXCEPTION WHEN unique_violation THEN NULL;
            END;
        END IF;

        IF NOT done THEN
            INSERT INTO "Handle" (handle, "spaceId")
            VALUES (base_handle || '-' || LEFT(id_hex, 12) || '.platform.mikoto.io', r.id);
        END IF;
    END LOOP;
END $$;

-- Enforce one handle per user/space with unique partial indexes
CREATE UNIQUE INDEX "Handle_userId_unique" ON "Handle" ("userId") WHERE "userId" IS NOT NULL;
CREATE UNIQUE INDEX "Handle_spaceId_unique" ON "Handle" ("spaceId") WHERE "spaceId" IS NOT NULL;

-- Constraint trigger: every User must have a handle (checked at commit time)
CREATE OR REPLACE FUNCTION check_user_has_handle() RETURNS trigger AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "Handle" WHERE "userId" = NEW.id) THEN
        RAISE EXCEPTION 'User % must have a handle', NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER user_must_have_handle
    AFTER INSERT ON "User"
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION check_user_has_handle();

-- Constraint trigger: every regular Space (type='NONE') must have a handle
CREATE OR REPLACE FUNCTION check_space_has_handle() RETURNS trigger AS $$
BEGIN
    IF NEW.type != 'NONE' THEN
        RETURN NEW;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM "Handle" WHERE "spaceId" = NEW.id) THEN
        RAISE EXCEPTION 'Space % must have a handle', NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER space_must_have_handle
    AFTER INSERT ON "Space"
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION check_space_has_handle();

-- Prevent deleting the last handle for a user
CREATE OR REPLACE FUNCTION prevent_handle_orphan_user() RETURNS trigger AS $$
BEGIN
    IF OLD."userId" IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM "Handle"
            WHERE "userId" = OLD."userId" AND handle != OLD.handle
        ) THEN
            -- Allow if the user is being deleted (CASCADE)
            IF EXISTS (SELECT 1 FROM "User" WHERE id = OLD."userId") THEN
                RAISE EXCEPTION 'Cannot remove the last handle for user %', OLD."userId";
            END IF;
        END IF;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_handle_orphan_user
    BEFORE DELETE ON "Handle"
    FOR EACH ROW EXECUTE FUNCTION prevent_handle_orphan_user();

-- Prevent deleting the last handle for a regular space
CREATE OR REPLACE FUNCTION prevent_handle_orphan_space() RETURNS trigger AS $$
BEGIN
    IF OLD."spaceId" IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM "Handle"
            WHERE "spaceId" = OLD."spaceId" AND handle != OLD.handle
        ) THEN
            -- Allow if the space is being deleted (CASCADE) or is DM/GROUP
            IF EXISTS (SELECT 1 FROM "Space" WHERE id = OLD."spaceId" AND type = 'NONE') THEN
                RAISE EXCEPTION 'Cannot remove the last handle for space %', OLD."spaceId";
            END IF;
        END IF;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_handle_orphan_space
    BEFORE DELETE ON "Handle"
    FOR EACH ROW EXECUTE FUNCTION prevent_handle_orphan_space();
