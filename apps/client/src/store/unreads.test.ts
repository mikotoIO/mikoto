import type { MikotoClient } from '@mikoto-io/mikoto.js';
import { beforeEach, describe, expect, test } from 'vitest';

import {
  ackChannel,
  ackStore,
  getSpaceNotificationLevel,
  isChannelUnread,
  isSpaceUnread,
  loadAcksForAllSpaces,
  notificationPreferenceStore,
  setSpaceNotificationLevel,
} from './unreads';

beforeEach(() => {
  ackStore.acks = {};
  notificationPreferenceStore.preferences = {};
});

describe('isChannelUnread', () => {
  test('a channel with no activity is read', () => {
    expect(isChannelUnread(null, 'c')).toBe(false);
    expect(isChannelUnread(undefined, 'c')).toBe(false);
  });

  test('a channel with activity but no ack is unread', () => {
    expect(isChannelUnread('2024-01-01T00:00:00Z', 'c')).toBe(true);
  });

  test('compares activity to the ack time', () => {
    ackChannel('c', '2024-01-01T12:00:00Z');
    expect(isChannelUnread('2024-01-01T11:59:59Z', 'c')).toBe(false);
    expect(isChannelUnread('2024-01-01T12:00:00Z', 'c')).toBe(false);
    expect(isChannelUnread('2024-01-01T12:00:01Z', 'c')).toBe(true);
  });

  test('compares instants, not strings', () => {
    ackChannel('c', '2024-01-01T21:00:00+09:00'); // 12:00Z
    expect(isChannelUnread('2024-01-01T11:00:00Z', 'c')).toBe(false);
    expect(isChannelUnread('2024-01-01T13:00:00Z', 'c')).toBe(true);
  });
});

function fakeClient(
  spaces: Record<
    string,
    {
      channels: { id: string; lastUpdated: string | null }[];
      listUnread?: () => Promise<{ channelId: string; timestamp: string }[]>;
    }
  >,
) {
  return {
    spaces: {
      _get: (id: string) => spaces[id],
      cache: new Map(Object.entries(spaces)),
    },
  } as unknown as MikotoClient;
}

describe('isSpaceUnread', () => {
  const client = fakeClient({
    s: {
      channels: [
        { id: 'a', lastUpdated: '2024-01-01T00:00:00Z' },
        { id: 'b', lastUpdated: null },
      ],
    },
  });

  test('unknown spaces are read', () => {
    expect(isSpaceUnread(client, 'missing')).toBe(false);
  });

  test('is unread while any channel is unread', () => {
    expect(isSpaceUnread(client, 's')).toBe(true);
    ackChannel('a', '2024-01-02T00:00:00Z');
    expect(isSpaceUnread(client, 's')).toBe(false);
  });
});

describe('loadAcksForAllSpaces', () => {
  test('loads acks from every space and tolerates failures', async () => {
    const client = fakeClient({
      ok: {
        channels: [],
        listUnread: async () => [
          { channelId: 'x', timestamp: '2024-01-01T00:00:00Z' },
        ],
      },
      broken: {
        channels: [],
        listUnread: async () => {
          throw new Error('offline');
        },
      },
    });
    await loadAcksForAllSpaces(client);
    expect(ackStore.acks).toEqual({ x: '2024-01-01T00:00:00Z' });
  });
});

describe('notification levels', () => {
  test('default to ALL', () => {
    expect(getSpaceNotificationLevel('s')).toBe('ALL');
  });

  test('can be set per space', () => {
    setSpaceNotificationLevel('s', 'NOTHING');
    expect(getSpaceNotificationLevel('s')).toBe('NOTHING');
    expect(getSpaceNotificationLevel('other')).toBe('ALL');
  });
});
