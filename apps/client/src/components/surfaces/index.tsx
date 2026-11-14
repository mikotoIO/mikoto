import { lazy } from 'react';
import type { ComponentProps } from 'react';

import { DesignStory } from '@/views/Palette';

import { BotSettingSurface } from './BotSettingSurface';
import { DiscoverySurface } from './DiscoverySurface';
import { ExplorerSurface } from './Explorer';
import { FriendsSurface } from './FriendsSurface';
import { MessageSurface } from './Messages';
import { SpaceExplorerSurface } from './SpaceExplorerSurface';
import { AccountSettingsSurface } from './settings/account';
import { ChannelSettingsSurface } from './settings/channel';
import { SpaceSettingsSurface } from './settings/space';

const VoiceSurface = lazy(() => import('./Voice'));
const DocumentSurface = lazy(() => import('./Documents'));

export const surfaceMap = {
  textChannel: MessageSurface,
  voiceChannel: VoiceSurface,
  documentChannel: DocumentSurface,
  spaceSettings: SpaceSettingsSurface,
  accountSettings: AccountSettingsSurface,
  channelSettings: ChannelSettingsSurface,
  botSettings: BotSettingSurface,
  friends: FriendsSurface,
  discovery: DiscoverySurface,
  palette: DesignStory,
  explorer: ExplorerSurface,
  spaceExplorer: SpaceExplorerSurface,
};

type SurfaceMap = {
  [key in keyof typeof surfaceMap]: {
    kind: key;
  } & ComponentProps<(typeof surfaceMap)[key]>;
};

export type TabBaseType = SurfaceMap[keyof SurfaceMap];

export type SurfaceKind = keyof typeof surfaceMap;

export function isSurfaceKind(kind: unknown): kind is SurfaceKind {
  return typeof kind === 'string' && Object.hasOwn(surfaceMap, kind);
}

/**
 * Narrows untrusted data (drag-and-drop payloads, storage) to a tab. Checks
 * the shape every tab shares: a known `kind` and a string `key`.
 */
export function isTabable(
  value: unknown,
): value is TabBaseType & { key: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'kind' in value &&
    isSurfaceKind(value.kind) &&
    'key' in value &&
    typeof value.key === 'string'
  );
}

/**
 * Renders the surface for a tab, with the tab's own props. A switch keeps
 * each surface's props type-checked without casts.
 */
export function renderSurface(tab: TabBaseType & { key: string }) {
  switch (tab.kind) {
    case 'textChannel': {
      const { kind: _k, key, ...rest } = tab;
      return <MessageSurface key={key} {...rest} />;
    }
    case 'voiceChannel': {
      const { kind: _k, key, ...rest } = tab;
      return <VoiceSurface key={key} {...rest} />;
    }
    case 'documentChannel': {
      const { kind: _k, key, ...rest } = tab;
      return <DocumentSurface key={key} {...rest} />;
    }
    case 'spaceSettings': {
      const { kind: _k, key, ...rest } = tab;
      return <SpaceSettingsSurface key={key} {...rest} />;
    }
    case 'accountSettings': {
      const { kind: _k, key, ...rest } = tab;
      return <AccountSettingsSurface key={key} {...rest} />;
    }
    case 'channelSettings': {
      const { kind: _k, key, ...rest } = tab;
      return <ChannelSettingsSurface key={key} {...rest} />;
    }
    case 'botSettings': {
      const { kind: _k, key, ...rest } = tab;
      return <BotSettingSurface key={key} {...rest} />;
    }
    case 'friends': {
      const { kind: _k, key, ...rest } = tab;
      return <FriendsSurface key={key} {...rest} />;
    }
    case 'discovery': {
      const { kind: _k, key, ...rest } = tab;
      return <DiscoverySurface key={key} {...rest} />;
    }
    case 'palette': {
      const { kind: _k, key, ...rest } = tab;
      return <DesignStory key={key} {...rest} />;
    }
    case 'explorer': {
      const { kind: _k, key, ...rest } = tab;
      return <ExplorerSurface key={key} {...rest} />;
    }
    case 'spaceExplorer': {
      const { kind: _k, key, ...rest } = tab;
      return <SpaceExplorerSurface key={key} {...rest} />;
    }
    default:
      return null;
  }
}

export * from './LoadingSurface';
export * from './ErrorSurface';
