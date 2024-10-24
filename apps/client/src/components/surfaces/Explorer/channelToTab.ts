import { faFile, faMicrophone } from '@fortawesome/free-solid-svg-icons';
import { Channel } from '@mikoto-io/mikoto.js';

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
      throw new Error('Unknown channel type');
  }
}

export function getIconFromChannelType(type: Channel['type']) {
  switch (type) {
    case 'VOICE':
      return faMicrophone;
    case 'DOCUMENT':
      return faFile;
    default:
      return undefined;
  }
}
