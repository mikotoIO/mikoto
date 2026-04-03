use std::collections::HashMap;

use openmls::prelude::*;
use openmls_basic_credential::SignatureKeyPair;
use openmls_rust_crypto::OpenMlsRustCrypto;
use openmls_traits::OpenMlsProvider;
use serde::{Deserialize, Serialize};
use tls_codec::{Deserialize as TlsDeserialize, Serialize as TlsSerialize};
use wasm_bindgen::prelude::*;

const CIPHERSUITE: Ciphersuite = Ciphersuite::MLS_128_DHKEMX25519_AES128GCM_SHA256_Ed25519;

// ── Serializable types for JS interop ────────────────────────────────

#[derive(Serialize, Deserialize)]
struct CredentialBundle {
    /// TLS-serialized SignatureKeyPair
    signature_keys: Vec<u8>,
    /// The identity bytes used in the credential
    identity: Vec<u8>,
}

#[derive(Serialize, Deserialize)]
struct CreateGroupResult {
    /// Serialized provider storage state (opaque, store in IndexedDB)
    group_state: Vec<u8>,
    /// TLS-serialized MLS Welcome message
    welcome: Vec<u8>,
    /// The MLS group ID
    group_id: Vec<u8>,
}

#[derive(Serialize, Deserialize)]
struct JoinGroupResult {
    /// Serialized provider storage state
    group_state: Vec<u8>,
    /// The MLS group ID
    group_id: Vec<u8>,
}

#[derive(Serialize, Deserialize)]
struct EncryptResult {
    /// TLS-serialized MLS ciphertext
    ciphertext: Vec<u8>,
    /// Updated provider storage state
    group_state: Vec<u8>,
}

#[derive(Serialize, Deserialize)]
struct DecryptResult {
    /// The decrypted plaintext
    plaintext: String,
    /// Updated provider storage state
    group_state: Vec<u8>,
}

#[derive(Serialize, Deserialize)]
struct ProcessCommitResult {
    /// Updated provider storage state
    group_state: Vec<u8>,
}

#[derive(Serialize, Deserialize)]
struct AddMemberResult {
    /// TLS-serialized Welcome message for the new member
    welcome: Vec<u8>,
    /// TLS-serialized Commit message to broadcast
    commit: Vec<u8>,
    /// Updated provider storage state
    group_state: Vec<u8>,
}

// ── Provider state serialization ─────────────────────────────────────
//
// OpenMLS stores all group state in a `MemoryStorage` (a HashMap<Vec<u8>, Vec<u8>>).
// We serialize this map as our "group_state" blob so it can be persisted in IndexedDB.

fn export_provider_state(provider: &OpenMlsRustCrypto) -> Result<Vec<u8>, JsError> {
    let values = provider.storage().values.read()
        .map_err(|e| JsError::new(&format!("Storage lock poisoned: {e}")))?;
    serde_json::to_vec(&*values)
        .map_err(|e| JsError::new(&format!("Failed to serialize storage: {e}")))
}

fn import_provider_state(provider: &OpenMlsRustCrypto, data: &[u8]) -> Result<(), JsError> {
    let values: HashMap<Vec<u8>, Vec<u8>> = serde_json::from_slice(data)
        .map_err(|e| JsError::new(&format!("Failed to deserialize storage: {e}")))?;
    let mut storage = provider.storage().values.write()
        .map_err(|e| JsError::new(&format!("Storage lock poisoned: {e}")))?;
    *storage = values;
    Ok(())
}

// ── Credential helpers ───────────────────────────────────────────────

fn restore_signature_keys(
    provider: &OpenMlsRustCrypto,
    bundle: &CredentialBundle,
) -> Result<SignatureKeyPair, JsError> {
    let keys = SignatureKeyPair::tls_deserialize_exact(&bundle.signature_keys)
        .map_err(|e| JsError::new(&format!("Failed to deserialize signature keys: {e}")))?;
    keys.store(provider.storage())
        .map_err(|e| JsError::new(&format!("Failed to store signature keys: {e}")))?;
    Ok(keys)
}

fn credential_with_key(bundle: &CredentialBundle, keys: &SignatureKeyPair) -> CredentialWithKey {
    let credential = BasicCredential::new(bundle.identity.clone());
    CredentialWithKey {
        credential: credential.into(),
        signature_key: keys.to_public_vec().into(),
    }
}

// ── Exported WASM functions ──────────────────────────────────────────

/// Generate a new MLS credential bundle for a user identity.
///
/// Returns a serialized `CredentialBundle` (store securely in IndexedDB).
#[wasm_bindgen(js_name = "generateCredential")]
pub fn generate_credential(identity: &str) -> Result<JsValue, JsError> {
    let p = OpenMlsRustCrypto::default();

    let signature_keys = SignatureKeyPair::new(CIPHERSUITE.signature_algorithm())
        .map_err(|e| JsError::new(&format!("Failed to generate signature keys: {e}")))?;
    signature_keys
        .store(p.storage())
        .map_err(|e| JsError::new(&format!("Failed to store keys: {e}")))?;

    let serialized_keys = signature_keys
        .tls_serialize_detached()
        .map_err(|e| JsError::new(&format!("Failed to serialize keys: {e}")))?;

    let bundle = CredentialBundle {
        signature_keys: serialized_keys,
        identity: identity.as_bytes().to_vec(),
    };

    serde_wasm_bindgen::to_value(&bundle)
        .map_err(|e| JsError::new(&format!("Failed to convert to JS: {e}")))
}

/// Generate MLS KeyPackages for uploading to the server.
///
/// Returns an array of TLS-serialized KeyPackage bytes.
#[wasm_bindgen(js_name = "generateKeyPackages")]
pub fn generate_key_packages(credential_js: JsValue, count: u32) -> Result<JsValue, JsError> {
    let bundle: CredentialBundle = serde_wasm_bindgen::from_value(credential_js)
        .map_err(|e| JsError::new(&format!("Invalid credential: {e}")))?;

    let p = OpenMlsRustCrypto::default();
    let keys = restore_signature_keys(&p, &bundle)?;
    let cred = credential_with_key(&bundle, &keys);

    let mut packages = Vec::with_capacity(count as usize);
    for _ in 0..count {
        let kp = KeyPackage::builder()
            .build(CIPHERSUITE, &p, &keys, cred.clone())
            .map_err(|e| JsError::new(&format!("Failed to build KeyPackage: {e}")))?;

        let serialized = kp
            .key_package()
            .tls_serialize_detached()
            .map_err(|e| JsError::new(&format!("Failed to serialize KeyPackage: {e}")))?;

        packages.push(serialized);
    }

    serde_wasm_bindgen::to_value(&packages)
        .map_err(|e| JsError::new(&format!("Failed to convert to JS: {e}")))
}

/// Create a new MLS group and add members from their KeyPackages.
///
/// `partner_key_packages_js` is an array of TLS-serialized KeyPackage bytes.
/// Returns a `CreateGroupResult`.
#[wasm_bindgen(js_name = "createGroup")]
pub fn create_group(
    credential_js: JsValue,
    partner_key_packages_js: JsValue,
) -> Result<JsValue, JsError> {
    let bundle: CredentialBundle = serde_wasm_bindgen::from_value(credential_js)
        .map_err(|e| JsError::new(&format!("Invalid credential: {e}")))?;
    let partner_kps: Vec<Vec<u8>> = serde_wasm_bindgen::from_value(partner_key_packages_js)
        .map_err(|e| JsError::new(&format!("Invalid key packages: {e}")))?;

    let p = OpenMlsRustCrypto::default();
    let keys = restore_signature_keys(&p, &bundle)?;
    let cred = credential_with_key(&bundle, &keys);

    let mut group = MlsGroup::builder()
        .ciphersuite(CIPHERSUITE)
        .use_ratchet_tree_extension(true)
        .build(&p, &keys, cred)
        .map_err(|e| JsError::new(&format!("Failed to create group: {e}")))?;

    // Deserialize and validate partner KeyPackages
    let kps: Vec<KeyPackage> = partner_kps
        .iter()
        .map(|kp_bytes| {
            KeyPackageIn::tls_deserialize_exact(kp_bytes)
                .map_err(|e| JsError::new(&format!("Failed to deserialize KeyPackage: {e}")))
                .and_then(|kp_in| {
                    kp_in
                        .validate(p.crypto(), ProtocolVersion::Mls10)
                        .map_err(|e| JsError::new(&format!("Invalid KeyPackage: {e}")))
                })
        })
        .collect::<Result<Vec<_>, _>>()?;

    let (_, welcome, _) = group
        .add_members(&p, &keys, &kps)
        .map_err(|e| JsError::new(&format!("Failed to add members: {e}")))?;

    group
        .merge_pending_commit(&p)
        .map_err(|e| JsError::new(&format!("Failed to merge commit: {e}")))?;

    let welcome_bytes = welcome
        .tls_serialize_detached()
        .map_err(|e| JsError::new(&format!("Failed to serialize Welcome: {e}")))?;

    let group_id = group.group_id().as_slice().to_vec();
    let group_state = export_provider_state(&p)?;

    let result = CreateGroupResult {
        group_state,
        welcome: welcome_bytes,
        group_id,
    };

    serde_wasm_bindgen::to_value(&result)
        .map_err(|e| JsError::new(&format!("Failed to convert to JS: {e}")))
}

/// Join an MLS group from a Welcome message.
///
/// Returns a `JoinGroupResult`.
#[wasm_bindgen(js_name = "joinGroup")]
pub fn join_group(credential_js: JsValue, welcome_bytes: &[u8]) -> Result<JsValue, JsError> {
    let bundle: CredentialBundle = serde_wasm_bindgen::from_value(credential_js)
        .map_err(|e| JsError::new(&format!("Invalid credential: {e}")))?;

    let p = OpenMlsRustCrypto::default();
    let _keys = restore_signature_keys(&p, &bundle)?;

    let msg_in = MlsMessageIn::tls_deserialize_exact(welcome_bytes)
        .map_err(|e| JsError::new(&format!("Failed to deserialize Welcome: {e}")))?;

    let welcome = match msg_in.extract() {
        MlsMessageBodyIn::Welcome(w) => w,
        _ => return Err(JsError::new("Message is not a Welcome")),
    };

    let join_config = MlsGroupJoinConfig::builder()
        .use_ratchet_tree_extension(true)
        .build();

    let group = StagedWelcome::new_from_welcome(&p, &join_config, welcome, None)
        .map_err(|e| JsError::new(&format!("Failed to stage Welcome: {e}")))?
        .into_group(&p)
        .map_err(|e| JsError::new(&format!("Failed to join group: {e}")))?;

    let group_id = group.group_id().as_slice().to_vec();
    let group_state = export_provider_state(&p)?;

    let result = JoinGroupResult {
        group_state,
        group_id,
    };

    serde_wasm_bindgen::to_value(&result)
        .map_err(|e| JsError::new(&format!("Failed to convert to JS: {e}")))
}

/// Encrypt a plaintext message for the group.
///
/// `group_state` is the serialized provider storage from a previous operation.
/// `group_id` is the MLS group ID bytes.
///
/// Returns an `EncryptResult` with ciphertext and updated group state.
#[wasm_bindgen(js_name = "encrypt")]
pub fn encrypt(
    credential_js: JsValue,
    group_state: &[u8],
    group_id: &[u8],
    plaintext: &str,
) -> Result<JsValue, JsError> {
    let bundle: CredentialBundle = serde_wasm_bindgen::from_value(credential_js)
        .map_err(|e| JsError::new(&format!("Invalid credential: {e}")))?;

    let p = OpenMlsRustCrypto::default();
    import_provider_state(&p, group_state)?;
    let keys = restore_signature_keys(&p, &bundle)?;

    let gid = GroupId::from_slice(group_id);
    let mut group = MlsGroup::load(p.storage(), &gid)
        .map_err(|e| JsError::new(&format!("Failed to load group: {e}")))?
        .ok_or_else(|| JsError::new("Group not found in storage"))?;

    let ciphertext_msg = group
        .create_message(&p, &keys, plaintext.as_bytes())
        .map_err(|e| JsError::new(&format!("Failed to encrypt: {e}")))?;

    let ciphertext = ciphertext_msg
        .tls_serialize_detached()
        .map_err(|e| JsError::new(&format!("Failed to serialize ciphertext: {e}")))?;

    let updated_state = export_provider_state(&p)?;

    let result = EncryptResult {
        ciphertext,
        group_state: updated_state,
    };

    serde_wasm_bindgen::to_value(&result)
        .map_err(|e| JsError::new(&format!("Failed to convert to JS: {e}")))
}

/// Decrypt an MLS application message.
///
/// Returns a `DecryptResult` with plaintext and updated group state.
#[wasm_bindgen(js_name = "decrypt")]
pub fn decrypt(
    credential_js: JsValue,
    group_state: &[u8],
    group_id: &[u8],
    ciphertext: &[u8],
) -> Result<JsValue, JsError> {
    let bundle: CredentialBundle = serde_wasm_bindgen::from_value(credential_js)
        .map_err(|e| JsError::new(&format!("Invalid credential: {e}")))?;

    let p = OpenMlsRustCrypto::default();
    import_provider_state(&p, group_state)?;
    let _keys = restore_signature_keys(&p, &bundle)?;

    let gid = GroupId::from_slice(group_id);
    let mut group = MlsGroup::load(p.storage(), &gid)
        .map_err(|e| JsError::new(&format!("Failed to load group: {e}")))?
        .ok_or_else(|| JsError::new("Group not found in storage"))?;

    let msg_in = MlsMessageIn::tls_deserialize_exact(ciphertext)
        .map_err(|e| JsError::new(&format!("Failed to deserialize message: {e}")))?;

    let protocol_msg = msg_in
        .try_into_protocol_message()
        .map_err(|e| JsError::new(&format!("Not a protocol message: {e}")))?;

    let processed = group
        .process_message(&p, protocol_msg)
        .map_err(|e| JsError::new(&format!("Failed to process message: {e}")))?;

    let plaintext = match processed.into_content() {
        ProcessedMessageContent::ApplicationMessage(app_msg) => {
            String::from_utf8(app_msg.into_bytes())
                .map_err(|e| JsError::new(&format!("Invalid UTF-8 in decrypted message: {e}")))?
        }
        _ => return Err(JsError::new("Expected application message, got handshake")),
    };

    let updated_state = export_provider_state(&p)?;

    let result = DecryptResult {
        plaintext,
        group_state: updated_state,
    };

    serde_wasm_bindgen::to_value(&result)
        .map_err(|e| JsError::new(&format!("Failed to convert to JS: {e}")))
}

/// Process an incoming MLS commit message (e.g. when a new device is added).
///
/// Returns a `ProcessCommitResult` with updated group state.
#[wasm_bindgen(js_name = "processCommit")]
pub fn process_commit(
    credential_js: JsValue,
    group_state: &[u8],
    group_id: &[u8],
    commit_bytes: &[u8],
) -> Result<JsValue, JsError> {
    let bundle: CredentialBundle = serde_wasm_bindgen::from_value(credential_js)
        .map_err(|e| JsError::new(&format!("Invalid credential: {e}")))?;

    let p = OpenMlsRustCrypto::default();
    import_provider_state(&p, group_state)?;
    let _keys = restore_signature_keys(&p, &bundle)?;

    let gid = GroupId::from_slice(group_id);
    let mut group = MlsGroup::load(p.storage(), &gid)
        .map_err(|e| JsError::new(&format!("Failed to load group: {e}")))?
        .ok_or_else(|| JsError::new("Group not found in storage"))?;

    let msg_in = MlsMessageIn::tls_deserialize_exact(commit_bytes)
        .map_err(|e| JsError::new(&format!("Failed to deserialize commit: {e}")))?;

    let protocol_msg = msg_in
        .try_into_protocol_message()
        .map_err(|e| JsError::new(&format!("Not a protocol message: {e}")))?;

    let processed = group
        .process_message(&p, protocol_msg)
        .map_err(|e| JsError::new(&format!("Failed to process commit: {e}")))?;

    match processed.into_content() {
        ProcessedMessageContent::StagedCommitMessage(staged_commit) => {
            group
                .merge_staged_commit(&p, *staged_commit)
                .map_err(|e| JsError::new(&format!("Failed to merge commit: {e}")))?;
        }
        _ => return Err(JsError::new("Expected commit message")),
    }

    let updated_state = export_provider_state(&p)?;

    let result = ProcessCommitResult {
        group_state: updated_state,
    };

    serde_wasm_bindgen::to_value(&result)
        .map_err(|e| JsError::new(&format!("Failed to convert to JS: {e}")))
}

/// Add a new member to an existing group (e.g. adding a new device).
///
/// Returns an `AddMemberResult` with Welcome, Commit, and updated state.
#[wasm_bindgen(js_name = "addMember")]
pub fn add_member(
    credential_js: JsValue,
    group_state: &[u8],
    group_id: &[u8],
    key_package_bytes: &[u8],
) -> Result<JsValue, JsError> {
    let bundle: CredentialBundle = serde_wasm_bindgen::from_value(credential_js)
        .map_err(|e| JsError::new(&format!("Invalid credential: {e}")))?;

    let p = OpenMlsRustCrypto::default();
    import_provider_state(&p, group_state)?;
    let keys = restore_signature_keys(&p, &bundle)?;

    let gid = GroupId::from_slice(group_id);
    let mut group = MlsGroup::load(p.storage(), &gid)
        .map_err(|e| JsError::new(&format!("Failed to load group: {e}")))?
        .ok_or_else(|| JsError::new("Group not found in storage"))?;

    let kp_in = KeyPackageIn::tls_deserialize_exact(key_package_bytes)
        .map_err(|e| JsError::new(&format!("Failed to deserialize KeyPackage: {e}")))?;
    let kp = kp_in
        .validate(p.crypto(), ProtocolVersion::Mls10)
        .map_err(|e| JsError::new(&format!("Invalid KeyPackage: {e}")))?;

    let (commit_msg, welcome, _) = group
        .add_members(&p, &keys, &[kp])
        .map_err(|e| JsError::new(&format!("Failed to add member: {e}")))?;

    group
        .merge_pending_commit(&p)
        .map_err(|e| JsError::new(&format!("Failed to merge commit: {e}")))?;

    let welcome_bytes = welcome
        .tls_serialize_detached()
        .map_err(|e| JsError::new(&format!("Failed to serialize Welcome: {e}")))?;

    let commit_bytes = commit_msg
        .tls_serialize_detached()
        .map_err(|e| JsError::new(&format!("Failed to serialize Commit: {e}")))?;

    let updated_state = export_provider_state(&p)?;

    let result = AddMemberResult {
        welcome: welcome_bytes,
        commit: commit_bytes,
        group_state: updated_state,
    };

    serde_wasm_bindgen::to_value(&result)
        .map_err(|e| JsError::new(&format!("Failed to convert to JS: {e}")))
}
