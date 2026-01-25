# Domain-Based Handles

Mikoto uses domain-based handles for users and spaces, similar to Bluesky's model. This enables identity verification, federation preparation, and branding.

## Handle Format

All handles are valid domain names:

- **Default handles**: `{username}.{instance_domain}` (e.g., `hayley.mikoto.io`)
- **Custom handles**: Any verified domain (e.g., `hayley.moe`, `rust-lang.org`)

Each user/space has exactly one handle. When a custom domain is verified, the old handle is released immediately and becomes available for others.

## Configuration

### Environment Variables

```env
# Required: Domain for default handles
HANDLE_DOMAIN=mikoto.io

# Optional: Ed25519 keypair for signing attestations (base64 encoded)
# Required for federation. Generate with:
#   openssl genpkey -algorithm ed25519 -outform DER | base64
HANDLE_PRIVATE_KEY=<base64-encoded-private-key>
HANDLE_PUBLIC_KEY=<base64-encoded-public-key>
```

## Database Schema

```sql
CREATE TABLE "Handle" (
    handle VARCHAR(253) PRIMARY KEY,  -- Max domain name length
    "userId" UUID REFERENCES "User"(id) ON DELETE CASCADE,
    "spaceId" UUID REFERENCES "Space"(id) ON DELETE CASCADE,
    "verifiedAt" TIMESTAMP(3),        -- null for default handles
    attestation JSONB,                -- signed proof for federation
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,

    CONSTRAINT handle_single_owner
        CHECK (("userId" IS NULL) != ("spaceId" IS NULL))
);
```

## Validation Rules

### Default Handles (Username Portion)

- 2-64 characters
- Lowercase alphanumeric, hyphens, and underscores only
- Cannot start or end with hyphen or underscore
- Pattern: `^[a-z0-9][a-z0-9_-]*[a-z0-9]$|^[a-z0-9]$`

### Custom Handles

- Must be a valid domain name (no protocol, no path)
- Maximum 253 characters
- Cannot be a subdomain of the instance's handle domain

## API Endpoints

### Setting Default Handles

**Users:**
```
POST /users/me/handle
Content-Type: application/json

{
  "handle": "hayley"  // or "hayley.mikoto.io"
}
```

**Spaces:**
```
PATCH /spaces/:spaceId
Content-Type: application/json

{
  "handle": "rust-lang"  // or "rust-lang.mikoto.io"
}
```

Plain usernames are automatically expanded to full default handles.

### Custom Domain Verification

#### Step 1: Start Verification

**Users:**
```
POST /users/me/handle/verify
Content-Type: application/json

{
  "handle": "hayley.moe"
}
```

**Spaces:**
```
POST /spaces/:spaceId/handle/verify
Content-Type: application/json

{
  "handle": "rust-lang.org"
}
```

**Response:**
```json
{
  "handle": "hayley.moe",
  "entityType": "user",
  "entityId": "550e8400-e29b-41d4-a716-446655440000",
  "nonce": "abc123...",
  "createdAt": "2026-01-24T12:00:00Z",
  "dnsTxtRecord": "v=1 home=mikoto.io user=550e8400-e29b-41d4-a716-446655440000 nonce=abc123...",
  "dnsTxtName": "_mikoto.hayley.moe",
  "wellKnownUrl": "https://hayley.moe/.well-known/mikoto.json",
  "wellKnownContent": "{\n  \"home_instance\": \"mikoto.io\",\n  \"entity_type\": \"user\",\n  \"entity_id\": \"550e8400-e29b-41d4-a716-446655440000\"\n}"
}
```

#### Step 2: Add Verification Record

Users can verify via either method:

**Option A: DNS TXT Record**

Add a TXT record at `_mikoto.hayley.moe`:
```
v=1 home=mikoto.io user=550e8400-e29b-41d4-a716-446655440000 nonce=abc123...
```

**Option B: Well-Known File**

Host a file at `https://hayley.moe/.well-known/mikoto.json`:
```json
{
  "home_instance": "mikoto.io",
  "entity_type": "user",
  "entity_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Step 3: Complete Verification

**Users:**
```
POST /users/me/handle/verify/complete
Content-Type: application/json

{
  "handle": "hayley.moe"
}
```

**Spaces:**
```
POST /spaces/:spaceId/handle/verify/complete
Content-Type: application/json

{
  "handle": "rust-lang.org"
}
```

**Response:**
```json
{
  "success": true,
  "method": "dns",  // or "well-known"
  "error": null
}
```

On success, the handle is updated and the old handle is released.

### Instance Information

```
GET /.well-known/mikoto/instance.json
```

**Response:**
```json
{
  "domain": "mikoto.io",
  "handleDomain": "mikoto.io",
  "publicKey": "<base64-encoded-ed25519-public-key>",
  "apiEndpoint": "https://api.mikoto.io"
}
```

## Attestations

When a custom domain is verified, an attestation is created and stored:

```json
{
  "handle": "hayley.moe",
  "entity_type": "user",
  "entity_id": "550e8400-e29b-41d4-a716-446655440000",
  "instance": "mikoto.io",
  "verified_at": "2026-01-24T12:00:00Z",
  "dns_record_hash": "sha256:abc123...",
  "signature": "<base64-encoded-ed25519-signature>"
}
```

The signature covers: `{handle}:{entity_type}:{entity_id}:{instance}:{verified_at}`

Other instances can verify attestations by:
1. Fetching the instance's public key from `/.well-known/mikoto/instance.json`
2. Verifying the Ed25519 signature

## Handle Resolution

```
GET /handles/:handle
```

**Response:**
```json
{
  "handle": "hayley.moe",
  "owner": {
    "type": "user",
    "id": "550e8400-e29b-41d4-a716-446655440000"
  },
  "verifiedAt": "2026-01-24T12:00:00Z",
  "createdAt": "2026-01-24T12:00:00Z"
}
```

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `InvalidHandle` | 400 | Handle format is invalid |
| `HandleTaken` | 409 | Handle is already claimed |
| `CustomDomainRequiresVerification` | 400 | Custom domains cannot be set directly |

## Rust API

### Handle Entity

```rust
use crate::entities::Handle;

// Validate a username
Handle::validate_username("hayley")?;

// Create a default handle from username
let handle = Handle::make_default_handle("hayley");
// -> "hayley.mikoto.io"

// Check if a handle is a default handle
Handle::is_default_handle("hayley.mikoto.io"); // true
Handle::is_default_handle("hayley.moe");       // false

// Extract username from default handle
Handle::extract_username("hayley.mikoto.io"); // Some("hayley")

// Claim/change handles
Handle::claim_for_user(handle, user_id, db).await?;
Handle::change_user_handle(user_id, new_handle, db).await?;
Handle::release_for_user(user_id, db).await?;
```

### Verification

```rust
use crate::functions::handle_verification::*;

// Generate verification challenge
let challenge = generate_challenge("hayley.moe", "user", user_id)?;

// Verify domain (checks DNS first, then well-known)
let result = verify_handle("hayley.moe", "user", user_id).await?;
if result.success {
    println!("Verified via: {}", result.method.unwrap());
}

// Create signed attestation
let attestation = create_attestation("hayley.moe", "user", user_id, None)?;

// Verify attestation signature
let valid = verify_attestation(&attestation)?;
```

## Federation (Future)

The attestation system is designed for federation:

1. **Cross-instance trust**: When Instance B encounters `@hayley.moe` from Instance A, it can verify the attestation signature using Instance A's public key.

2. **Direct verification**: Instances can periodically re-verify domains via DNS/well-known as an audit mechanism.

3. **Handle portability**: Users can migrate between instances by re-verifying their custom domain on the new instance.
