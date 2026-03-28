import { Box, Presence } from '@chakra-ui/react';
import { MikotoChannel } from '@mikoto-io/mikoto.js';
import { type ReactNode, useRef, useState } from 'react';

import { useInterval, useMikoto } from '@/hooks';

export interface Typer {
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

export interface TypingIndicatorProps {
  typers: Typer[];
  channel: MikotoChannel;
}

function formatTyperGroup(names: string[], verb: string) {
  if (names.length === 0) return null;
  const joined = names.join(', ');
  const plural = names.length > 1 ? `are ${verb}` : `is ${verb}`;
  return (
    <>
      <strong>{joined}</strong> {plural}
    </>
  );
}

export function TypingIndicator({ typers, channel }: TypingIndicatorProps) {
  const mikoto = useMikoto();

  const space = mikoto.spaces._get(channel.spaceId);
  const humanNames: string[] = [];
  const botNames: string[] = [];

  for (const t of typers) {
    const member = space?.members?._get(t.userId);
    const name = member?.user.name ?? 'Unknown';
    if (member?.user.category === 'BOT') {
      botNames.push(name);
    } else {
      humanNames.push(name);
    }
  }

  const humanPart = formatTyperGroup(humanNames, 'typing...');
  const botPart = formatTyperGroup(botNames, 'thinking...');

  const lastContent = useRef<ReactNode>(null);
  if (typers.length > 0) {
    lastContent.current = (
      <>
        {humanPart}
        {humanPart && botPart && ' '}
        {botPart}
      </>
    );
  }

  return (
    <Box px={4} ml={1} fontSize="12px">
      <Presence
        present={typers.length > 0}
        animationName={{
          _open: 'slide-from-bottom, fade-in',
          _closed: 'slide-to-bottom, fade-out',
        }}
        animationDuration="fast"
      >
        {lastContent.current}
      </Presence>
    </Box>
  );
}
