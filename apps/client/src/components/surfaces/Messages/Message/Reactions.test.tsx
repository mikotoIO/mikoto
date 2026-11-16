// @vitest-environment happy-dom
import {
  type MessageExt,
  MikotoMessage,
  MikotoUser,
} from '@mikoto-io/mikoto.js';
import {
  act,
  cleanup,
  fireEvent,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';

import { CustomEmojiProvider, Markdown } from '@/components/molecules/markdown';
import {
  addSpace,
  createTestClient,
  makeMember,
  makeSpace,
  makeUser,
  renderWithClient,
  uuid,
} from '@/test/mikoto';

import { Reactions } from './Reactions';

afterEach(cleanup);

async function setup(reactions: MessageExt['reactions'] = []) {
  const { client, backend } = createTestClient();
  const me = makeUser({ name: 'Misaka' });
  const other = makeUser({ name: 'Kuroko' });
  client.user.me = new MikotoUser(me, client);
  const blob = {
    id: uuid(),
    name: 'blob',
    image: 'emoji/blob.png',
    creatorId: null,
  };
  const data = makeSpace();
  const space = addSpace(client, {
    ...data,
    emojis: [{ ...blob, spaceId: data.id }],
  });
  backend.members.set(space.id, [
    makeMember(space.id, me),
    makeMember(space.id, other),
  ]);
  await space.members.list();
  const message = new MikotoMessage(
    {
      id: uuid(),
      channelId: space.channels[0].id,
      authorId: other.id,
      author: other,
      content: 'hi',
      timestamp: new Date().toISOString(),
      editedTimestamp: null,
      attachments: [],
      // 'BLOB' stands for this space's custom emoji, 'me'/'other' for users.
      reactions: reactions.map((r) => ({
        ...r,
        emoji: r.emoji === 'BLOB' ? blob.id : r.emoji,
        emojiId: r.emojiId === 'BLOB' ? blob.id : r.emojiId,
        userIds: r.userIds.map((id) =>
          id === 'me' ? me.id : id === 'other' ? other.id : id,
        ),
      })),
    },
    client,
  );
  const render = () =>
    renderWithClient(
      client,
      <CustomEmojiProvider space={space}>
        <Reactions message={message} inSpace />
      </CustomEmojiProvider>,
    );
  return { client, backend, space, message, me, other, blob, render };
}

const chip = (label: string) =>
  screen.getByRole('button', { name: new RegExp(`^${label}`) });

describe('Reactions', () => {
  test('nothing to show without reactions', async () => {
    const { render } = await setup();
    const { container } = render();
    expect(container.textContent).toBe('');
  });

  test('shows each emoji with its count, marking mine', async () => {
    const { render } = await setup([
      { emoji: 'heart', count: 2, userIds: ['me', 'other'], emojiId: null },
      { emoji: 'tada', count: 1, userIds: ['other'], emojiId: null },
    ]);
    render();
    expect(chip(':heart:').textContent).toContain('2');
    expect(chip(':heart:').getAttribute('aria-pressed')).toBe('true');
    expect(chip(':tada:').getAttribute('aria-pressed')).toBe('false');
    // standard emoji render as Twemoji images once the set loads
    await waitFor(() =>
      expect(chip(':heart:').querySelector('img')?.src).toContain('twitter'),
    );
  });

  test("clicking toggles the user's own reaction", async () => {
    const { render, backend, message, other } = await setup([
      { emoji: 'tada', count: 1, userIds: ['other'], emojiId: null },
    ]);
    render();

    await act(async () => fireEvent.click(chip(':tada:')));
    expect(chip(':tada:').textContent).toContain('2');
    expect(chip(':tada:').getAttribute('aria-pressed')).toBe('true');
    expect(backend.reactionCalls).toHaveLength(1);
    expect(backend.reactionCalls[0]).toMatch(/^PUT .*\/reactions\/tada$/);

    await act(async () => fireEvent.click(chip(':tada:')));
    expect(message.reactions[0].userIds).toEqual([other.id]);
    expect(backend.reactionCalls[1]).toMatch(/^DELETE /);
  });

  test('a refused reaction is rolled back', async () => {
    const { render, backend } = await setup([
      { emoji: 'tada', count: 1, userIds: ['other'], emojiId: null },
    ]);
    backend.reactionStatus = 403;
    render();
    await act(async () => fireEvent.click(chip(':tada:')));
    await waitFor(() => expect(chip(':tada:').textContent).toContain('1'));
    expect(chip(':tada:').getAttribute('aria-pressed')).toBe('false');
  });

  test('custom emoji reactions show the space emoji', async () => {
    const { render } = await setup([
      { emoji: 'BLOB', count: 1, userIds: ['other'], emojiId: 'BLOB' },
    ]);
    render();
    const img = chip(':blob:').querySelector('img');
    expect(img?.getAttribute('src')).toContain('emoji/blob.png');
  });
});

describe('custom emoji in messages', () => {
  test('<emoji:ID:name> renders the emoji, by id', async () => {
    const { client, space, blob } = await setup();
    renderWithClient(
      client,
      <CustomEmojiProvider space={space}>
        <Markdown content={`hello <emoji:${blob.id}:old_name>`} />
      </CustomEmojiProvider>,
    );
    // the current name wins over the one written in the message
    const img = screen.getByRole('img', { name: ':blob:' });
    expect(img.getAttribute('src')).toContain('emoji/blob.png');
  });

  test('a :name: shortcode is never a custom emoji', async () => {
    const { client, space } = await setup();
    renderWithClient(
      client,
      <CustomEmojiProvider space={space}>
        <Markdown content="hello :blob:" />
      </CustomEmojiProvider>,
    );
    expect(screen.queryByRole('img', { name: ':blob:' })).toBeNull();
  });

  test('emoji from another space the user is in still show', async () => {
    const { client, blob } = await setup();
    // rendered outside any space, as in a DM
    renderWithClient(client, <Markdown content={`<emoji:${blob.id}:blob>`} />);
    expect(screen.getByRole('img', { name: ':blob:' })).toBeTruthy();
  });

  test('unknown emoji fall back to their name', async () => {
    const { client } = await setup();
    const { container } = renderWithClient(
      client,
      <Markdown content={`hi <emoji:${uuid()}:gone>`} />,
    );
    expect(screen.queryByRole('img')).toBeNull();
    expect(container.textContent).toBe('hi :gone:');
  });

  test('renames show up live', async () => {
    const { client, space, blob } = await setup();
    renderWithClient(
      client,
      <CustomEmojiProvider space={space}>
        <Markdown content={`<emoji:${blob.id}:blob>`} />
      </CustomEmojiProvider>,
    );
    act(() =>
      space.emojis
        ._get(blob.id)
        ?._patch({ ...blob, spaceId: space.id, name: 'wave' }),
    );
    await waitFor(() =>
      expect(screen.getByRole('img', { name: ':wave:' })).toBeTruthy(),
    );
  });
});
