import { checkPermission } from '@mikoto-io/permcheck';

import { ClientMember, ClientSpace } from '../store';

export function enforcePermission(
  subject: ClientMember,
  action: string | bigint,
  object: ClientSpace,
) {
  const act = typeof action === 'string' ? BigInt(action) : action;
}
