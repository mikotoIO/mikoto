import { Channel } from '@mikoto-io/mikoto.js';
import { FileText, Hash, type LucideIcon, Volume2 } from 'lucide-react';

import { Tabable } from '@/store/surface';

export function channelToTab(channel: Channel): Tabable {
  switch (channel.type) {
    case 'TEXT':
      return {
        kind: 'textChannel',
        key: channel.id,
        channelId: channel.id,
      };
    case 'VOICE':
      return {
        kind: 'voiceChannel',
        key: channel.id,
        channelId: channel.id,
      };
    case 'DOCUMENT':
      return {
        kind: 'documentChannel',
        key: channel.id,
        channelId: channel.id,
      };
    default:
      throw new Error(`Unknown channel type: ${String(channel.type)}`);
  }
}

/** Like channelToTab, but returns null for channel types the client can't open. */
export function tryChannelToTab(channel: Channel): Tabable | null {
  try {
    return channelToTab(channel);
  } catch {
    return null;
  }
}

/** The Lucide icon for a channel type. Text (and anything unknown) is `Hash`. */
export function getIconFromChannelType(type: Channel['type']): LucideIcon {
  switch (type) {
    case 'VOICE':
      return Volume2;
    case 'DOCUMENT':
      return FileText;
    default:
      return Hash;
  }
}

/** Short, user-facing name of a channel type. */
export function channelKindLabel(type: Channel['type']): string {
  switch (type) {
    case 'VOICE':
      return 'Voice';
    case 'DOCUMENT':
      return 'Doc';
    default:
      return 'Channel';
  }
}
