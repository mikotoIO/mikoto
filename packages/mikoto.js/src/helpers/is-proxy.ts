import { getVersion } from 'valtio/vanilla';

export function isValtioProxy(obj: any) {
  return typeof getVersion(obj) === 'number';
}
