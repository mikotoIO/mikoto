/**
 * MikotoClient end to end against an in-memory backend: REST through the
 * generated client, live events through the WebSocket, and the managers'
 * caches in between.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import type { MikotoClient } from '../MikotoClient';
import { MikotoMessage } from '../managers/message';
import * as f from './support/factories';
import {
  type FakeBackend,
  HttpError,
  connectClient,
  installFakes,
  restoreFakes,
  settle,
} from './support/fakeBackend';

let backend: FakeBackend;
let client: MikotoClient;

beforeEach(async () => {
  backend = installFakes();
  ({ client } = await connectClient(backend));
});

afterEach(() => {
  client.disconnect();
  restoreFakes();
});

/** Load a space into the client through `spaces.list`. */
async function loadSpace(data = f.space()) {
  backend.on('get', '/spaces', () => [data]);
  const [space] = await client.spaces.list();
  await settle(); // let the member prefetch finish
  return space;
}

describe('REST', () => {
  test('sends the access token', async () => {
    backend.on('get', '/users/me', () => f.user());
    await client.user.load();
    expect(backend.calls('get', '/users/me')[0].headers.authorization).toBe(
      'Bearer token-1',
    );
  });

  test('refreshes the token once on a 401 and retries', async () => {
    const me = f.user({ name: 'misaka' });
    backend.on('get', '/users/me', (req) => {
      if (req.headers.authorization !== 'Bearer token-2') {
        throw new HttpError(401);
      }
      return me;
    });
    backend.token = 'token-2';
    const user = await client.user.load();
    expect(user.name).toBe('misaka');
    expect(backend.calls('get', '/users/me')).toHaveLength(2);
  });

  test('rejects responses that do not match the schema', async () => {
    backend.on('get', '/users/me', () => ({ id: 'not-a-uuid' }));
    await expect(client.user.load()).rejects.toThrow();
  });
});

describe('spaces', () => {
  test('listing caches spaces, their channels and roles', async () => {
    const data = f.space();
    const space = await loadSpace(data);

    expect(client.spaces._get(data.id)).toBe(space);
    expect(space.channels.map((c) => c.id)).toEqual([data.channels[0].id]);
    expect(client.channels._get(data.channels[0].id)?.space).toBe(space);
    expect(space.roles._get(data.roles[0].id)?.name).toBe('@everyone');
    // members are prefetched
    expect(backend.calls('get', '/spaces/:spaceId/members')).toHaveLength(1);
  });

  test('live create, update and delete', async () => {
    const data = f.space({ name: 'before' });
    await backend.emit('spaces.onCreate', data);
    const space = client.spaces._get(data.id)!;
    expect(space.name).toBe('before');

    await backend.emit('spaces.onUpdate', { ...data, name: 'after' });
    expect(client.spaces._get(data.id)).toBe(space); // same instance
    expect(space.name).toBe('after');

    await backend.emit('spaces.onDelete', data);
    expect(client.spaces._get(data.id)).toBeUndefined();
  });

  test('an update prunes channels the server no longer has', async () => {
    const data = f.space();
    const extra = f.channel(data.id, { name: 'extra' });
    data.channels.push(extra);
    const space = await loadSpace(data);
    expect(space.channels).toHaveLength(2);

    await backend.emit('spaces.onUpdate', {
      ...data,
      channels: [data.channels[0]],
    });
    expect(space.channels.map((c) => c.name)).toEqual(['general']);
    expect(client.channels._get(extra.id)).toBeUndefined();
  });

  test('updates for unknown spaces are ignored', async () => {
    await backend.emit('spaces.onUpdate', f.space());
    expect(client.spaces.values()).toHaveLength(0);
  });

  test('join returns the cached space', async () => {
    const data = f.space();
    backend.on('post', '/spaces/join/:invite', (req) => {
      expect(req.params.invite).toBe('abc123');
      return data;
    });
    const space = await client.spaces.join('abc123');
    expect(client.spaces._get(data.id)).toBe(space);
  });
});

describe('channels', () => {
  test('live create, update and delete keep the space in step', async () => {
    const space = await loadSpace();
    const created = f.channel(space.id, { name: 'news' });

    await backend.emit('channels.onCreate', created);
    expect(space.channels.map((c) => c.name)).toEqual(['general', 'news']);
    // duplicate events don't duplicate the channel
    await backend.emit('channels.onCreate', created);
    expect(space.channelIds).toHaveLength(2);

    await backend.emit('channels.onUpdate', { ...created, name: 'updates' });
    expect(client.channels._get(created.id)?.name).toBe('updates');

    await backend.emit('channels.onDelete', created);
    expect(space.channels.map((c) => c.name)).toEqual(['general']);
    expect(client.channels._get(created.id)).toBeUndefined();
  });

  test('messages are fetched from the space or DM endpoint', async () => {
    const space = await loadSpace();
    const channel = space.channels[0];
    backend.on(
      'get',
      '/spaces/:spaceId/channels/:channelId/messages',
      (req) => {
        expect(req.params).toEqual({
          spaceId: space.id,
          channelId: channel.id,
        });
        expect(req.query.get('limit')).toBe('20');
        return [f.message(channel.id, f.user(), { content: 'in space' })];
      },
    );
    const msgs = await channel.listMessages(20, null);
    expect(msgs.map((m) => m.content)).toEqual(['in space']);

    await backend.emit('channels.onCreate', f.channel(null, { name: 'dm' }));
    const dm = client.channels.values().find((c) => c.name === 'dm')!;
    backend.on('get', '/dm/:channelId/messages', () => [
      f.message(dm.id, f.user(), { content: 'in dm' }),
    ]);
    const dms = await dm.listMessages(20, null);
    expect(dms.map((m) => m.content)).toEqual(['in dm']);
  });

  test('sendMessage posts the content', async () => {
    const space = await loadSpace();
    const channel = space.channels[0];
    backend.on('post', '/spaces/:spaceId/channels/:channelId/messages', (req) =>
      f.message(channel.id, f.user(), req.body as { content: string }),
    );
    await channel.sendMessage('hi there');
    const [req] = backend.calls(
      'post',
      '/spaces/:spaceId/channels/:channelId/messages',
    );
    expect(req.body).toEqual({ content: 'hi there', attachments: [] });
  });
});

describe('members and roles', () => {
  test('live member events', async () => {
    const space = await loadSpace();
    const data = f.member(space.id);

    await backend.emit('members.onCreate', data);
    const member = space.members._get(data.userId)!;
    expect(member.user.name).toBe(data.user.name);

    await backend.emit('members.onUpdate', { ...data, name: 'nick' });
    expect(space.members._get(data.userId)).toBe(member);
    expect(member.name).toBe('nick');

    await backend.emit('members.onDelete', data);
    expect(space.members._get(data.userId)).toBeUndefined();
  });

  test('live role events', async () => {
    const space = await loadSpace();
    const data = f.role(space.id, { name: 'Mods', permissions: '2' });

    await backend.emit('roles.onCreate', data);
    expect(space.roles._get(data.id)?.name).toBe('Mods');
    await backend.emit('roles.onUpdate', { ...data, color: '#ff0000' });
    expect(space.roles._get(data.id)?.color).toBe('#ff0000');
    await backend.emit('roles.onDelete', data);
    expect(space.roles._get(data.id)).toBeUndefined();
  });

  test('checkPermission combines roles and lets the owner through', async () => {
    const owner = f.user();
    const data = f.space({ ownerId: owner.id });
    const mods = f.role(data.id, { name: 'Mods', permissions: String(1 << 3) });
    const helpers = f.role(data.id, {
      name: 'Help',
      permissions: String(1 << 5),
    });
    data.roles.push(mods, helpers);
    const space = await loadSpace(data);

    await backend.emit(
      'members.onCreate',
      f.member(space.id, f.user(), { roleIds: [mods.id, helpers.id] }),
    );
    await backend.emit('members.onCreate', f.member(space.id, owner));
    const [member, ownerMember] = space.members
      .values()
      .sort((a) => (a.userId === owner.id ? 1 : -1));

    expect(member.checkPermission(1n << 3n)).toBe(true);
    expect(member.checkPermission(String(1 << 5))).toBe(true);
    expect(member.checkPermission(1n << 4n)).toBe(false);
    expect(ownerMember.isOwner).toBe(true);
    expect(ownerMember.checkPermission(1n << 4n)).toBe(true);
  });

  test('superusers pass every check, as on the server', async () => {
    const data = f.space();
    const admins = f.role(data.id, { name: 'Admins', permissions: '1' });
    data.roles.push(admins);
    const space = await loadSpace(data);
    await backend.emit(
      'members.onCreate',
      f.member(space.id, f.user(), { roleIds: [admins.id] }),
    );
    const [admin] = space.members.values();
    expect(admin.checkPermission(1n << 10n)).toBe(true);
  });

  test('ensureLoaded deduplicates and remembers non-members', async () => {
    const space = await loadSpace();
    const known = f.member(space.id);
    let gate!: () => void;
    const opened = new Promise<void>((r) => (gate = r));
    backend.on('get', '/spaces/:spaceId/members/:userId', async (req) => {
      await opened;
      if (req.params.userId === known.userId) return known;
      throw new HttpError(404);
    });

    const a = space.members.ensureLoaded(known.userId);
    const b = space.members.ensureLoaded(known.userId);
    gate();
    expect(await a).toBe(await b);
    expect(
      backend.calls('get', '/spaces/:spaceId/members/:userId'),
    ).toHaveLength(1);
    // now cached
    await space.members.ensureLoaded(known.userId);
    expect(
      backend.calls('get', '/spaces/:spaceId/members/:userId'),
    ).toHaveLength(1);

    const stranger = f.uuid();
    expect(await space.members.ensureLoaded(stranger)).toBeUndefined();
    expect(await space.members.ensureLoaded(stranger)).toBeUndefined();
    expect(
      backend.calls('get', '/spaces/:spaceId/members/:userId'),
    ).toHaveLength(2);
  });

  test('ensureLoaded retries after transient failures', async () => {
    const space = await loadSpace();
    const data = f.member(space.id);
    let fail = true;
    backend.on('get', '/spaces/:spaceId/members/:userId', () => {
      if (fail) throw new HttpError(503);
      return data;
    });
    expect(await space.members.ensureLoaded(data.userId)).toBeUndefined();
    fail = false;
    expect((await space.members.ensureLoaded(data.userId))?.userId).toBe(
      data.userId,
    );
  });

  test('list pages through members with a cursor', async () => {
    const data = f.space();
    const page1 = Array.from({ length: 100 }, () => f.member(data.id));
    const page2 = [f.member(data.id)];
    backend.on('get', '/spaces/:spaceId/members', (req) =>
      req.query.get('cursor') === page1[99].id ? page2 : page1,
    );
    const space = await loadSpace(data);
    expect(space.members.values()).toHaveLength(100);
    expect(space.members.hasMore).toBe(true);

    await space.members.list();
    expect(space.members.values()).toHaveLength(101);
    expect(space.members.hasMore).toBe(false);
    await space.members.list(); // nothing more to fetch
    expect(backend.calls('get', '/spaces/:spaceId/members')).toHaveLength(2);
  });
});

describe('custom emoji', () => {
  test('come with the space and follow live events', async () => {
    const data = f.space();
    const blob = f.emoji(data.id, { name: 'Blob' });
    data.emojis = [blob];
    const space = await loadSpace(data);
    expect(space.emojis.getByName('blob')?.id).toBe(blob.id);

    const wave = f.emoji(space.id, { name: 'wave' });
    await backend.emit('emojis.onCreate', wave);
    expect(space.emojis._get(wave.id)?.name).toBe('wave');
    await backend.emit('emojis.onUpdate', { ...wave, name: 'wave2' });
    expect(space.emojis.getByName('wave2')?.id).toBe(wave.id);
    await backend.emit('emojis.onDelete', wave);
    expect(space.emojis._get(wave.id)).toBeUndefined();

    await backend.emit('spaces.onUpdate', { ...data, emojis: [] });
    expect(space.emojis.values()).toEqual([]);
  });

  test('create posts the uploaded image and caches the result', async () => {
    const space = await loadSpace();
    backend.on('post', '/spaces/:spaceId/emojis', (req) => ({
      ...f.emoji(space.id),
      ...(req.body as object),
    }));
    const emoji = await space.emojis.create({
      name: 'party',
      image: 'emoji/abc.png',
    });
    expect(emoji.name).toBe('party');
    expect(space.emojis._get(emoji.id)).toBe(emoji);
    // the server's broadcast of the same emoji doesn't duplicate it
    await backend.emit('emojis.onCreate', {
      id: emoji.id,
      spaceId: space.id,
      name: 'party',
      image: 'emoji/abc.png',
      creatorId: null,
    });
    expect(space.emojis.values()).toHaveLength(1);
  });
});

describe('reactions', () => {
  async function setup() {
    const me = f.user();
    backend.on('get', '/users/me', () => me);
    await client.user.load();
    const space = await loadSpace();
    const channelId = space.channelIds[0];
    const message = new MikotoMessage(f.message(channelId), client);
    const path =
      '/spaces/:spaceId/channels/:channelId/messages/:messageId/reactions/:emoji';
    return { me, space, message, path };
  }

  test('react shows at once and calls the API', async () => {
    const { me, message, path } = await setup();
    backend.on('put', path, () => null);

    const pending = message.react('+1');
    expect(message.reactions).toEqual([
      { emoji: '+1', emojiId: null, count: 1, userIds: [me.id] },
    ]);
    expect(message.hasReacted('+1')).toBe(true);
    await pending;
    expect(backend.calls('put', path)[0].params.emoji).toBe('+1');

    // the server's event for our own reaction changes nothing
    message._applyReaction({ userId: me.id, emoji: '+1', emojiId: null }, true);
    expect(message.reactions[0].count).toBe(1);
  });

  test('a refused reaction is rolled back', async () => {
    const { message, path } = await setup();
    backend.on('put', path, () => {
      throw new HttpError(400);
    });
    await expect(message.react('tada')).rejects.toBeTruthy();
    expect(message.reactions).toEqual([]);
  });

  test('toggle removes an existing reaction', async () => {
    const { me, message, path } = await setup();
    const other = f.uuid();
    message._applyReaction({ userId: other, emoji: 'heart' }, true);
    message._applyReaction({ userId: me.id, emoji: 'heart' }, true);
    expect(message.reactions[0].count).toBe(2);

    backend.on('delete', path, () => null);
    await message.toggleReaction('heart');
    expect(message.reactions).toEqual([
      { emoji: 'heart', emojiId: null, count: 1, userIds: [other] },
    ]);
    expect(backend.calls('delete', path)).toHaveLength(1);

    message._applyReaction({ userId: other, emoji: 'heart' }, false);
    expect(message.reactions).toEqual([]);
  });

  test('custom emoji reactions are keyed by id', async () => {
    const { message, path } = await setup();
    backend.on('put', path, () => null);
    const id = f.uuid();
    await message.react(id);
    expect(message.reactions[0]).toMatchObject({ emoji: id, emojiId: id });
    expect(backend.calls('put', path)[0].params.emoji).toBe(id);
  });

  test('DM messages use the DM routes', async () => {
    const { me } = await setup();
    const dm = f.channel(null);
    await backend.emit('channels.onCreate', dm);
    const message = new MikotoMessage(f.message(dm.id), client);
    const path = '/dm/:channelId/messages/:messageId/reactions/:emoji';
    backend.on('put', path, () => null);
    await message.react('wave');
    expect(backend.calls('put', path)).toHaveLength(1);
    expect(message.reactions[0].userIds).toEqual([me.id]);
  });
});

describe('relationships', () => {
  test('are loaded on first connect and kept live', async () => {
    expect(backend.calls('get', '/relations')).toHaveLength(1);
    const me = f.user();
    const rel = f.relationship(me.id, f.user(), { state: 'INCOMING_REQUEST' });

    await backend.emit('relations.onCreate', rel);
    expect(client.relationships._get(rel.id)?.state).toBe('INCOMING_REQUEST');
    await backend.emit('relations.onUpdate', { ...rel, state: 'FRIEND' });
    expect(client.relationships._get(rel.id)?.state).toBe('FRIEND');
  });
});

describe('reconnecting', () => {
  test('resyncs state missed while disconnected', async () => {
    const kept = f.space({ name: 'kept' });
    const gone = f.space({ name: 'gone' });
    backend.on('get', '/spaces', () => [kept, gone]);
    await client.spaces.list();
    const onResync = vi.fn();
    client.onResync(onResync);

    // While we're away: one space is left, the other renamed.
    backend.on('get', '/spaces', () => [{ ...kept, name: 'renamed' }]);
    backend.on('get', '/users/me', () => f.user());
    backend.socket.serverClose();
    client.reconnectNow();
    await settle();
    backend.socket.serverOpen();
    await settle();
    backend.socket.serverSend('ready');
    await settle();
    await settle();

    expect(client.spaces.values().map((s) => s.name)).toEqual(['renamed']);
    expect(client.user.me).toBeDefined();
    expect(onResync).toHaveBeenCalledTimes(1);
    expect(client.connection.status).toBe('connected');
  });

  test('events from the new socket still reach managers', async () => {
    backend.socket.serverClose();
    client.reconnectNow();
    await settle();
    backend.socket.serverOpen();
    await settle();
    backend.socket.serverSend('ready');
    await settle();

    const data = f.space();
    await backend.emit('spaces.onCreate', data);
    expect(client.spaces._get(data.id)).toBeDefined();
  });
});
