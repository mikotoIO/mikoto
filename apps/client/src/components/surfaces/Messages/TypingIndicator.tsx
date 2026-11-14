import type { MikotoChannel } from '@mikoto-io/mikoto.js';
import { useEffect, useState } from 'react';

import { useInterval, useMikoto } from '@/hooks';

import styles from './Messages.module.css';

interface Typer {
  timestamp: number;
  userId: string;
}

export function useTyping() {
  const [currentTypers, setCurrentTypers] = useState<Typer[]>([]);

  useInterval(() => {
    if (currentTypers.length === 0) return;
    setCurrentTypers(currentTypers.filter((x) => x.timestamp > Date.now()));
  }, 500);
  return [currentTypers, setCurrentTypers] as const;
}

/** Three bobbing dots. Static when the user prefers reduced motion. */
export function TypingDots() {
  return (
    <span className={styles.dots} aria-hidden>
      <i />
      <i />
      <i />
    </span>
  );
}

function formatGroup(names: string[], verb: string) {
  if (names.length === 0) return null;
  const shown =
    names.length > 3
      ? [`${names.length} people`]
      : names.length === 1
        ? names
        : [names.slice(0, -1).join(', '), names[names.length - 1]];
  return (
    <>
      {shown.map((n, i) => (
        <span key={n}>
          {i > 0 && ' and '}
          <b>{n}</b>
        </span>
      ))}{' '}
      {names.length === 1 ? `is ${verb}` : `are ${verb}`}
    </>
  );
}

interface TypingIndicatorProps {
  typers: Typer[];
  channel: MikotoChannel;
}

/** "Theo is typing" above the composer. Always reserves its line. */
export function TypingIndicator({ typers, channel }: TypingIndicatorProps) {
  const mikoto = useMikoto();

  const space = channel.spaceId
    ? mikoto.spaces._get(channel.spaceId)
    : undefined;

  useEffect(() => {
    if (!space) return;
    typers.forEach((t) => {
      space.members.ensureLoaded(t.userId);
    });
  }, [space, typers]);

  const humanNames: string[] = [];
  const botNames: string[] = [];

  for (const t of typers) {
    const member = space?.members?._get(t.userId);
    const dmUser = !space
      ? mikoto.relationships.values().find((r) => r.relationId === t.userId)
          ?.user
      : undefined;
    const user = member?.user ?? dmUser;
    const name = member?.name ?? user?.name ?? 'Someone';
    if (user?.category === 'BOT') {
      botNames.push(name);
    } else {
      humanNames.push(name);
    }
  }

  const humanPart = formatGroup(humanNames, 'typing');
  const botPart = formatGroup(botNames, 'thinking');

  return (
    <div className={styles.typing} aria-live="polite">
      {typers.length > 0 && (
        <>
          <TypingDots />
          <span className={styles.typingText}>
            {humanPart}
            {humanPart && botPart && ', '}
            {botPart}
          </span>
        </>
      )}
    </div>
  );
}
