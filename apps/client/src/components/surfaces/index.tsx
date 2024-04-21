import { lazy } from 'react';
import type { ComponentProps } from 'react';

import { DesignStory } from '@/views/Palette';

import { AccountSettingsSurface } from './AccountSettings';
import { BotSettingSurface } from './BotSettingSurface';
import { ChannelSettingsSurface } from './ChannelSettings';
import { DiscoverySurface } from './DiscoverySurface';
import { DMExplorerSurface, ExplorerSurface } from './Explorer';
import { FriendsSurface } from './FriendsSurface';
import { SearchSurface } from './SearchSurface';
import { SpaceSettingsSurface } from './SpaceSettings';
import { WelcomeSurface } from './WelcomeSurface';
import { MessageSurface } from './Messages';

export const surfaceMap = {
  textChannel: MessageSurface,
  voiceChannel: lazy(() => import('./VoiceSurface')),
  documentChannel: lazy(() => import('./Documents')),
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
