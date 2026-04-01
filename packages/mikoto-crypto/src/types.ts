/** Serialized MLS credential bundle (opaque, store in IndexedDB). */
export interface CredentialBundle {
  signature_keys: number[];
  identity: number[];
}

/** Result from createGroup. */
export interface CreateGroupResult {
  /** Serialized provider storage state. */
  group_state: number[];
  /** TLS-serialized MLS Welcome message. */
  welcome: number[];
  /** The MLS group ID. */
  group_id: number[];
}

/** Result from joinGroup. */
export interface JoinGroupResult {
  /** Serialized provider storage state. */
  group_state: number[];
  /** The MLS group ID. */
  group_id: number[];
}

/** Result from encrypt. */
export interface EncryptResult {
  /** TLS-serialized MLS ciphertext. */
  ciphertext: number[];
  /** Updated provider storage state. */
  group_state: number[];
}

/** Result from decrypt. */
export interface DecryptResult {
  /** The decrypted plaintext. */
  plaintext: string;
  /** Updated provider storage state. */
  group_state: number[];
}

/** Result from processCommit. */
export interface ProcessCommitResult {
  /** Updated provider storage state. */
  group_state: number[];
}

/** Result from addMember. */
export interface AddMemberResult {
  /** TLS-serialized Welcome message for the new member. */
  welcome: number[];
  /** TLS-serialized Commit message to broadcast. */
  commit: number[];
  /** Updated provider storage state. */
  group_state: number[];
}
