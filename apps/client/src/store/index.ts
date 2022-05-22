import { atom } from 'recoil';
import constants from '../constants';
import { Channel } from '../models';

export const treebarSpaceIdState = atom<string | null>({
  key: 'treebarSpaceId',
  default: constants.defaultSpace,
});

type TabBaseType =
  | { kind: 'textChannel'; channel: Channel }
  | { kind: 'unknown' };

export type Tabable = TabBaseType & {
  key: string;
  name: string;
};

export const tabbedChannelState = atom<{
  index: number;
  tabs: Tabable[];
}>({
  key: 'tabbedChannels',
  default: {
    index: 0,
    tabs: [],
  },
});
