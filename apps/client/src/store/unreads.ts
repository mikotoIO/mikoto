import { MikotoClient } from '@mikoto-io/mikoto.js';
import { proxy } from 'valtio/vanilla';

// Global ack state: channelId -> ack timestamp
export const ackStore = proxy<{ acks: Record<string, string> }>({
  acks: {},
});

export async function loadAcksForSpace(space: { listUnread: () => Promise<{ channelId: string; timestamp: string }[]> }) {
  const unreads = await space.listUnread();
  for (const u of unreads) {
    ackStore.acks[u.channelId] = u.timestamp;
  }
}

export function loadAcksForAllSpaces(mikoto: MikotoClient) {
  for (const space of mikoto.spaces.cache.values()) {
    loadAcksForSpace(space);
  }
}

export function ackChannel(channelId: string, timestamp: string) {
  ackStore.acks[channelId] = timestamp;
}

export function isChannelUnread(lastUpdated: string | null | undefined, channelId: string): boolean {
  if (!lastUpdated) return false;
  const ack = ackStore.acks[channelId];
  if (!ack) return true;
  return new Date(lastUpdated).getTime() > new Date(ack).getTime();
}

export function isSpaceUnread(mikoto: MikotoClient, spaceId: string): boolean {
  const space = mikoto.spaces._get(spaceId);
  if (!space) return false;
  for (const channel of space.channels) {
    if (isChannelUnread(channel.lastUpdated, channel.id)) return true;
  }
  return false;
}
