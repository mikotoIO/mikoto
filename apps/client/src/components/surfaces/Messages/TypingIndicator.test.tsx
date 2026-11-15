// @vitest-environment happy-dom
import { cleanup, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';

import {
  addSpace,
  createTestClient,
  makeMember,
  makeSpace,
  makeUser,
  renderWithClient,
} from '@/test/mikoto';

import { TypingIndicator } from './TypingIndicator';

afterEach(cleanup);

async function setup(names: { name: string; bot?: boolean }[]) {
  const { client, backend } = createTestClient();
  const data = makeSpace();
  const members = names.map(({ name, bot }) =>
    makeMember(data.id, makeUser({ name, category: bot ? 'BOT' : null })),
  );
  backend.members.set(data.id, members);
  const space = addSpace(client, data);
  await space.members.list();
  const channel = space.channels[0];
  const typers = members.map((m) => ({
    userId: m.userId,
    timestamp: Date.now() + 5000,
  }));
  return { client, backend, space, channel, typers, members };
}

const typingText = () => document.querySelector('[aria-live]')?.textContent;

describe('TypingIndicator', () => {
  test('renders nothing but its reserved line when nobody types', async () => {
    const { client, channel } = await setup([]);
    renderWithClient(client, <TypingIndicator typers={[]} channel={channel} />);
    expect(typingText()).toBe('');
  });

  test('one person', async () => {
    const { client, channel, typers } = await setup([{ name: 'Mikoto' }]);
    renderWithClient(
      client,
      <TypingIndicator typers={typers} channel={channel} />,
    );
    expect(typingText()).toBe('Mikoto is typing');
  });

  test('a few people', async () => {
    const { client, channel, typers } = await setup([
      { name: 'Kuroko' },
      { name: 'Uiharu' },
      { name: 'Saten' },
    ]);
    renderWithClient(
      client,
      <TypingIndicator typers={typers} channel={channel} />,
    );
    expect(typingText()).toBe('Kuroko, Uiharu and Saten are typing');
  });

  test('many people are counted', async () => {
    const { client, channel, typers } = await setup(
      ['a', 'b', 'c', 'd'].map((name) => ({ name })),
    );
    renderWithClient(
      client,
      <TypingIndicator typers={typers} channel={channel} />,
    );
    expect(typingText()).toBe('4 people are typing');
  });

  test('bots are thinking, not typing', async () => {
    const { client, channel, typers } = await setup([
      { name: 'Touma' },
      { name: 'Helper', bot: true },
    ]);
    renderWithClient(
      client,
      <TypingIndicator typers={typers} channel={channel} />,
    );
    expect(typingText()).toBe('Touma is typing, Helper is thinking');
  });

  test('fetches members it has not seen yet', async () => {
    const { client, backend, channel, space } = await setup([]);
    const late = makeMember(space.id, makeUser({ name: 'Latecomer' }));
    backend.members.set(space.id, [late]);
    const typers = [{ userId: late.userId, timestamp: Date.now() + 5000 }];
    const { rerender } = renderWithClient(
      client,
      <TypingIndicator typers={typers} channel={channel} />,
    );
    expect(typingText()).toBe('Someone is typing');

    const path = `/spaces/${space.id}/members/${late.userId}`;
    await waitFor(() => expect(backend.requests).toContain(path));
    await waitFor(() => expect(space.members._get(late.userId)).toBeTruthy());
    // The typing list re-renders the indicator every 500ms in the app.
    rerender(<TypingIndicator typers={[...typers]} channel={channel} />);
    expect(typingText()).toBe('Latecomer is typing');
  });
});
