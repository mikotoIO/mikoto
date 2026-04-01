import { type IDBPDatabase, openDB } from 'idb';

const DB_NAME = 'mikoto-crypto';
const DB_VERSION = 1;

const STORE_CREDENTIALS = 'credentials';
const STORE_GROUPS = 'groups';
const STORE_META = 'meta';

interface MikotoCryptoDB {
  [STORE_CREDENTIALS]: {
    key: string; // "{userId}:{deviceId}"
    value: Uint8Array; // serialized CredentialBundle (via JSON -> bytes)
  };
  [STORE_GROUPS]: {
    key: string; // spaceId
    value: {
      groupId: Uint8Array;
      groupState: Uint8Array;
    };
  };
  [STORE_META]: {
    key: string;
    value: string;
  };
}

/**
 * IndexedDB-backed storage for MLS credentials and group states.
 *
 * All data is keyed per-device. Each browser tab/device has its own
 * credential and group states.
 */
export class KeyStore {
  private dbPromise: Promise<IDBPDatabase<MikotoCryptoDB>>;

  constructor() {
    this.dbPromise = openDB<MikotoCryptoDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_CREDENTIALS)) {
          db.createObjectStore(STORE_CREDENTIALS);
        }
        if (!db.objectStoreNames.contains(STORE_GROUPS)) {
          db.createObjectStore(STORE_GROUPS);
        }
        if (!db.objectStoreNames.contains(STORE_META)) {
          db.createObjectStore(STORE_META);
        }
      },
    });
  }

  // ── Device ID ────────────────────────────────────────────────────

  /** Get or create a stable device ID for this browser. */
  async getDeviceId(): Promise<string> {
    const db = await this.dbPromise;
    const existing = await db.get(STORE_META, 'deviceId');
    if (existing) return existing;

    const deviceId = crypto.randomUUID();
    await db.put(STORE_META, deviceId, 'deviceId');
    return deviceId;
  }

  // ── Credentials ──────────────────────────────────────────────────

  async getCredential(
    userId: string,
    deviceId: string,
  ): Promise<Uint8Array | undefined> {
    const db = await this.dbPromise;
    return db.get(STORE_CREDENTIALS, `${userId}:${deviceId}`);
  }

  async setCredential(
    userId: string,
    deviceId: string,
    data: Uint8Array,
  ): Promise<void> {
    const db = await this.dbPromise;
    await db.put(STORE_CREDENTIALS, data, `${userId}:${deviceId}`);
  }

  async deleteCredential(userId: string, deviceId: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete(STORE_CREDENTIALS, `${userId}:${deviceId}`);
  }

  // ── Group state ──────────────────────────────────────────────────

  async getGroupState(
    spaceId: string,
  ): Promise<{ groupId: Uint8Array; groupState: Uint8Array } | undefined> {
    const db = await this.dbPromise;
    return db.get(STORE_GROUPS, spaceId);
  }

  async setGroupState(
    spaceId: string,
    groupId: Uint8Array,
    groupState: Uint8Array,
  ): Promise<void> {
    const db = await this.dbPromise;
    await db.put(STORE_GROUPS, { groupId, groupState }, spaceId);
  }

  async deleteGroupState(spaceId: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete(STORE_GROUPS, spaceId);
  }

  async listGroupSpaceIds(): Promise<string[]> {
    const db = await this.dbPromise;
    return db.getAllKeys(STORE_GROUPS) as Promise<string[]>;
  }

  // ── Cleanup ──────────────────────────────────────────────────────

  async clear(): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction(
      [STORE_CREDENTIALS, STORE_GROUPS, STORE_META],
      'readwrite',
    );
    await Promise.all([
      tx.objectStore(STORE_CREDENTIALS).clear(),
      tx.objectStore(STORE_GROUPS).clear(),
      tx.objectStore(STORE_META).clear(),
      tx.done,
    ]);
  }
}
