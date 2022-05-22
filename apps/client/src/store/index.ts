import { atom } from 'recoil';
import constants from '../constants';
import { Channel } from '../models';

export const treebarSpaceIdState = atom<string | null>({
  key: 'treebarSpaceId',
  default: constants.defaultSpace,
});

export const tabIndexState = atom<number>({
  key: 'tabIndex',
  default: 0,
});

type TabBaseType =
  | { kind: 'textChannel'; channel: Channel }
  | { kind: 'unknown' };

export type Tabable = TabBaseType & {
  key: string;
  name: string;
};

export const tabbedChannelState = atom<Tabable[]>({
  key: 'tabbedChannels',
  default: [],
});
