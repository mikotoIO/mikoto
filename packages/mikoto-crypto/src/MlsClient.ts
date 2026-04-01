import type {
  AddMemberResult,
  CreateGroupResult,
  CredentialBundle,
  DecryptResult,
  EncryptResult,
  JoinGroupResult,
  ProcessCommitResult,
} from './types';
import { KeyStore } from './KeyStore';

// Dynamic import of the WASM module.
// The actual path is resolved at build time by the bundler (Vite).
type WasmModule = typeof import('../wasm/mls_wasm');
let wasmModule: WasmModule | null = null;

async function loadWasm(): Promise<WasmModule> {
  if (wasmModule) return wasmModule;
  const mod = await import('../wasm/mls_wasm');
  await mod.default();
  wasmModule = mod;
  return mod;
}

/** Number of KeyPackages to generate and upload at once. */
const KEY_PACKAGE_BATCH_SIZE = 50;
/** Upload more when count drops below this. */
const KEY_PACKAGE_LOW_THRESHOLD = 10;

/**
 * High-level MLS client for E2EE direct messages.
 *
 * Wraps the WASM openmls module and IndexedDB key storage.
 * Each instance is bound to a single user + device.
 */
export class MlsClient {
  private store = new KeyStore();
  private userId!: string;
  private deviceId!: string;
  private credential!: CredentialBundle;

  /** Initialize the client for a user. Call once after login. */
  async initialize(userId: string): Promise<void> {
    const wasm = await loadWasm();
    this.userId = userId;
    this.deviceId = await this.store.getDeviceId();

    // Load or generate credential
    const existing = await this.store.getCredential(this.userId, this.deviceId);
    if (existing) {
      this.credential = JSON.parse(new TextDecoder().decode(existing));
    } else {
      this.credential = wasm.generateCredential(
        `${this.userId}:${this.deviceId}`,
      ) as CredentialBundle;
      const encoded = new TextEncoder().encode(JSON.stringify(this.credential));
      await this.store.setCredential(this.userId, this.deviceId, encoded);
    }
  }

  /** Get the device ID for this browser instance. */
  getDeviceId(): string {
    return this.deviceId;
  }

  // ── KeyPackage management ────────────────────────────────────────

  /**
   * Generate KeyPackages and return them as base64 strings
   * ready for upload to the server.
   */
  async generateKeyPackages(
    count: number = KEY_PACKAGE_BATCH_SIZE,
  ): Promise<{ deviceId: string; data: string; ciphersuite: string }[]> {
    const wasm = await loadWasm();
    const packages: Uint8Array[] = wasm.generateKeyPackages(
      this.credential,
      count,
    );

    return packages.map((pkg) => ({
      deviceId: this.deviceId,
      data: uint8ToBase64(new Uint8Array(pkg)),
      ciphersuite: 'MLS_128_DHKEMX25519_AES128GCM_SHA256_Ed25519',
    }));
  }

  /**
   * Check KeyPackage count on server and replenish if low.
   * Pass the API client's count and upload functions.
   */
  async ensureKeyPackages(
    getCount: () => Promise<number>,
    upload: (
      packages: { deviceId: string; data: string; ciphersuite: string }[],
    ) => Promise<void>,
  ): Promise<void> {
    const count = await getCount();
    if (count < KEY_PACKAGE_LOW_THRESHOLD) {
      const packages = await this.generateKeyPackages();
      await upload(packages);
    }
  }

  // ── Group creation (DM initiator) ────────────────────────────────

  /**
   * Create a new MLS group for a DM, adding the partner's devices.
   *
   * @param spaceId - The DM space ID (used as IndexedDB key)
   * @param partnerKeyPackages - Base64-encoded KeyPackages, one per partner device
   * @returns The Welcome message (base64) to send to the partner
   */
  async createDmGroup(
    spaceId: string,
    partnerKeyPackages: string[],
  ): Promise<{ welcome: string }> {
    const wasm = await loadWasm();

    const kpBytes = partnerKeyPackages.map((kp) => Array.from(base64ToUint8(kp)));

    const result: CreateGroupResult = wasm.createGroup(
      this.credential,
      kpBytes,
    );

    await this.store.setGroupState(
      spaceId,
      new Uint8Array(result.group_id),
      new Uint8Array(result.group_state),
    );

    return {
      welcome: uint8ToBase64(new Uint8Array(result.welcome)),
    };
  }

  // ── Group joining (DM recipient) ─────────────────────────────────

  /**
   * Join an MLS group from a Welcome message.
   *
   * @param spaceId - The DM space ID
   * @param welcomeBase64 - Base64-encoded Welcome message
   */
  async joinDmGroup(spaceId: string, welcomeBase64: string): Promise<void> {
    const wasm = await loadWasm();
    const welcomeBytes = base64ToUint8(welcomeBase64);

    const result: JoinGroupResult = wasm.joinGroup(
      this.credential,
      welcomeBytes,
    );

    await this.store.setGroupState(
      spaceId,
      new Uint8Array(result.group_id),
      new Uint8Array(result.group_state),
    );
  }

  // ── Encrypt / Decrypt ────────────────────────────────────────────

  /**
   * Encrypt a plaintext message for a DM space.
   *
   * @returns Base64-encoded ciphertext ready to send.
   */
  async encrypt(spaceId: string, plaintext: string): Promise<string> {
    const wasm = await loadWasm();
    const stored = await this.store.getGroupState(spaceId);
    if (!stored) {
      throw new Error(`No MLS group state for space ${spaceId}`);
    }

    const result: EncryptResult = wasm.encrypt(
      this.credential,
      stored.groupState,
      stored.groupId,
      plaintext,
    );

    // Persist updated state (forward secrecy: old keys are deleted)
    await this.store.setGroupState(
      spaceId,
      stored.groupId,
      new Uint8Array(result.group_state),
    );

    return uint8ToBase64(new Uint8Array(result.ciphertext));
  }

  /**
   * Decrypt an MLS ciphertext from a DM space.
   *
   * @param ciphertextBase64 - Base64-encoded ciphertext from the server
   * @returns The decrypted plaintext.
   */
  async decrypt(spaceId: string, ciphertextBase64: string): Promise<string> {
    const wasm = await loadWasm();
    const stored = await this.store.getGroupState(spaceId);
    if (!stored) {
      throw new Error(`No MLS group state for space ${spaceId}`);
    }

    const result: DecryptResult = wasm.decrypt(
      this.credential,
      stored.groupState,
      stored.groupId,
      base64ToUint8(ciphertextBase64),
    );

    await this.store.setGroupState(
      spaceId,
      stored.groupId,
      new Uint8Array(result.group_state),
    );

    return result.plaintext;
  }

  // ── Multi-device: process commits ────────────────────────────────

  /**
   * Process an incoming MLS commit (e.g. a new device was added to the group).
   */
  async processCommit(
    spaceId: string,
    commitBase64: string,
  ): Promise<void> {
    const wasm = await loadWasm();
    const stored = await this.store.getGroupState(spaceId);
    if (!stored) {
      throw new Error(`No MLS group state for space ${spaceId}`);
    }

    const result: ProcessCommitResult = wasm.processCommit(
      this.credential,
      stored.groupState,
      stored.groupId,
      base64ToUint8(commitBase64),
    );

    await this.store.setGroupState(
      spaceId,
      stored.groupId,
      new Uint8Array(result.group_state),
    );
  }

  // ── Multi-device: add member ─────────────────────────────────────

  /**
   * Add a new member (device) to an existing DM group.
   *
   * @returns Welcome and Commit messages (base64) to relay via the server.
   */
  async addMember(
    spaceId: string,
    keyPackageBase64: string,
  ): Promise<{ welcome: string; commit: string }> {
    const wasm = await loadWasm();
    const stored = await this.store.getGroupState(spaceId);
    if (!stored) {
      throw new Error(`No MLS group state for space ${spaceId}`);
    }

    const result: AddMemberResult = wasm.addMember(
      this.credential,
      stored.groupState,
      stored.groupId,
      base64ToUint8(keyPackageBase64),
    );

    await this.store.setGroupState(
      spaceId,
      stored.groupId,
      new Uint8Array(result.group_state),
    );

    return {
      welcome: uint8ToBase64(new Uint8Array(result.welcome)),
      commit: uint8ToBase64(new Uint8Array(result.commit)),
    };
  }

  // ── State queries ────────────────────────────────────────────────

  /** Check if we have MLS group state for a space. */
  async hasGroupState(spaceId: string): Promise<boolean> {
    const stored = await this.store.getGroupState(spaceId);
    return stored !== undefined;
  }

  /** Clear all crypto state (logout). */
  async clear(): Promise<void> {
    await this.store.clear();
  }
}

// ── Base64 helpers ─────────────────────────────────────────────────

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
