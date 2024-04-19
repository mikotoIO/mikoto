import { lazy } from 'react';
import type { ComponentProps } from 'react';

import { DesignStory } from '@/views/Palette';

import { AccountSettingsSurface } from './AccountSettingsSurface';
import { BotSettingSurface } from './BotSettingSurface';
import { ChannelSettingsSurface } from './ChannelSettingsSurface';
import { DiscoverySurface } from './DiscoverySurface';
import { DMExplorerSurface, ExplorerSurface } from './Explorer';
import { FriendsSurface } from './FriendsSurface';
import { MessageSurface } from './MessageSurface';
import { SearchSurface } from './SearchSurface';
import { SpaceSettingsSurface } from './SpaceSettingsSurface';
import { WelcomeSurface } from './WelcomeSurface';

export const surfaceMap = {
  textChannel: MessageSurface,
  voiceChannel: lazy(() => import('./VoiceSurface')),
  documentChannel: lazy(() => import('./DocumentSurface')),
  search: SearchSurface,
  spaceSettings: SpaceSettingsSurface,
  accountSettings: AccountSettingsSurface,
  channelSettings: ChannelSettingsSurface,
  botSettings: BotSettingSurface,
  friends: FriendsSurface,
  discovery: DiscoverySurface,
  palette: DesignStory,
  welcome: WelcomeSurface,
  explorer: ExplorerSurface,
  dmExplorer: DMExplorerSurface,
};

type SurfaceMap = {
  [key in keyof typeof surfaceMap]: {
    kind: key;
  } & ComponentProps<(typeof surfaceMap)[key]>;
};

export type TabBaseType = SurfaceMap[keyof SurfaceMap];
