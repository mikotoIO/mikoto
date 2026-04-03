// Type stub for the mls_wasm WASM module (built by wasm-pack).
// Allows tsc to typecheck without requiring the WASM build output.
import type {
  AddMemberResult,
  CreateGroupResult,
  CredentialBundle,
  DecryptResult,
  EncryptResult,
  JoinGroupResult,
  ProcessCommitResult,
} from '../src/types';

export default function init(): Promise<void>;
export function generateCredential(identity: string): CredentialBundle;
export function generateKeyPackages(
  credential: CredentialBundle,
  count: number,
): Uint8Array[];
export function createGroup(
  credential: CredentialBundle,
  partnerKeyPackages: number[][],
): CreateGroupResult;
export function joinGroup(
  credential: CredentialBundle,
  welcomeBytes: Uint8Array,
): JoinGroupResult;
export function encrypt(
  credential: CredentialBundle,
  groupState: Uint8Array,
  groupId: Uint8Array,
  plaintext: string,
): EncryptResult;
export function decrypt(
  credential: CredentialBundle,
  groupState: Uint8Array,
  groupId: Uint8Array,
  ciphertext: Uint8Array,
): DecryptResult;
export function processCommit(
  credential: CredentialBundle,
  groupState: Uint8Array,
  groupId: Uint8Array,
  commitBytes: Uint8Array,
): ProcessCommitResult;
export function addMember(
  credential: CredentialBundle,
  groupState: Uint8Array,
  groupId: Uint8Array,
  keyPackageBytes: Uint8Array,
): AddMemberResult;
