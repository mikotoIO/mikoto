import { lazy } from 'react';
import type { ComponentProps } from 'react';

import { DesignStory } from '@/views/Palette';

import { BotSettingSurface } from './BotSettingSurface';
import { DiscoverySurface } from './DiscoverySurface';
import { DMExplorerSurface, ExplorerSurface } from './Explorer';
import { FriendsSurface } from './FriendsSurface';
import { MessageSurface } from './Messages';
import { SearchSurface } from './SearchSurface';
import { SpaceInviteSurface } from './SpaceInviteSurface';
import { WelcomeSurface } from './WelcomeSurface';
import { AccountSettingsSurface } from './settings/account';
import { ChannelSettingsSurface } from './settings/channel';
import { SpaceSettingsSurface } from './settings/space';

export const surfaceMap = {
  textChannel: MessageSurface,
  voiceChannel: lazy(() => import('./Voice')),
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
  spaceInvite: SpaceInviteSurface,
};

type SurfaceMap = {
  [key in keyof typeof surfaceMap]: {
    kind: key;
  } & ComponentProps<(typeof surfaceMap)[key]>;
};

export type TabBaseType = SurfaceMap[keyof SurfaceMap];

export * from './LoadingSurface';
export * from './ErrorSurface';
