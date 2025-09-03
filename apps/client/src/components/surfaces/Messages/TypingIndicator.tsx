import { Box } from '@chakra-ui/react';
import { MikotoChannel } from '@mikoto-io/mikoto.js';
import { useState } from 'react';

import { useInterval, useMikoto } from '@/hooks';
import { TypingDots } from '@/ui';

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

export function TypingIndicator({ typers, channel }: TypingIndicatorProps) {
  const mikoto = useMikoto();

  return (
    <Box px={4} fontSize="12px">
      {typers.length > 0 && (
        <div>
          <TypingDots />
          <strong>
            {typers
              .map(
                (x) =>
                  mikoto.spaces._get(channel.spaceId)?.members?._get(x.userId)
                    ?.user.name ?? 'Unknown',
              )
              .join(', ')}
          </strong>{' '}
          is typing...
        </div>
      )}
    </Box>
  );
}
