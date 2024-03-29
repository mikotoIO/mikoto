import { Box, Flex } from '@chakra-ui/react';
import styled from '@emotion/styled';
import { ClientMessage } from 'mikotojs';
import { makeAutoObservable, runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { atom } from 'recoil';

import { ContextMenu, useContextMenu } from '../ContextMenu';
import { BotTag } from '../atoms/BotTag';
import { MessageAvatar } from '../atoms/MessageAvatar';
import { TypingDots } from '../atoms/TypingDots';
import { Markdown } from './markdown';

const dateFormat = new Intl.DateTimeFormat('en', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function isToday(someDate: Date): boolean {
  const today = new Date();
  return (
    someDate.getDate() === today.getDate() &&
    someDate.getMonth() === today.getMonth() &&
    someDate.getFullYear() === today.getFullYear()
  );
}

function padTime(n: number): string {
  return String(n).padStart(2, '0');
}

const MessageContainer = styled.div<{ isSimple?: boolean }>`
  margin: 0;
  display: grid;
  grid-template-columns: min-content auto;
  min-height: 20px;
  grid-gap: 16px;
  padding: 2px 20px 6px;
  padding-top: ${(p) => (p.isSimple ? '2px' : '8px')};
  &:hover {
    background-color: rgba(0, 0, 0, 0.06);
  }

  p {
    margin: 0;
  }

  code {
    border-radius: 4px;
    padding: 2px;
    background-color: var(--chakra-colors-gray-800);
  }

  .avatar {
    margin-top: 4px;
  }
`;

const MessageInner = styled.div`
  margin: 0;
  padding-top: 4px;
  font-size: 14px;

  a {
    color: #00aff4;

    &:not(:hover) {
      text-decoration: none;
    }
  }

  img {
    max-height: 300px;
    max-width: 400px;
  }

  ul,
  ol {
    padding-inline-start: 24px;
  }

  p:not(:first-of-type),
  pre:not(:first-of-type) {
    margin-top: 8px;
  }
`;

const Name = styled.div<{ color?: string | null }>`
  font-size: 14px;
  font-weight: 600;
  margin: 0;
  color: ${(p) => p.color ?? 'currentColor'};
  cursor: pointer;
  &:hover {
    text-decoration: underline;
    text-decoration-color: ${(p) => p.color ?? 'currentColor'};
  }
`;

function Timestamp({ time }: { time: Date }) {
  return (
    <Box color="gray.400" fontSize="xs">
      {isToday(time) ? 'Today at ' : dateFormat.format(time)}{' '}
      {padTime(time.getHours())}:{padTime(time.getMinutes())}
    </Box>
  );
}

const AvatarFiller = styled.div`
  margin: 0;
  width: 40px;
`;

interface MessageProps {
  message: ClientMessage;
  isSimple?: boolean;
  editState: MessageEditState;
}

export const messageEditIdState = atom<{ id: string; content: string } | null>({
  key: 'messageEditId',
  default: null,
});

export class MessageEditState {
  message: ClientMessage | null = null;
  constructor() {
    makeAutoObservable(this);
  }
}

const EditedNote = styled.span`
  font-size: 12px;
  color: var(--chakra-colors-gray-400);
  margin-left: 4px;
`;

export const MessageItem = observer(
  ({ message, editState, isSimple }: MessageProps) => {
    const menu = useContextMenu(() => (
      <ContextMenu>
        {message.authorId === message.client.me.id && (
          <ContextMenu.Link
            onClick={() => {
              runInAction(() => {
                editState.message = message;
              });
            }}
          >
            Edit Message
          </ContextMenu.Link>
        )}
        <ContextMenu.Link
          onClick={async () => {
            await navigator.clipboard.writeText(message.content);
          }}
        >
          Copy Markdown
        </ContextMenu.Link>
        <ContextMenu.Link>Pin Message</ContextMenu.Link>
        <ContextMenu.Link
          onClick={async () => {
            await message.delete();
          }}
        >
          Delete Message
        </ContextMenu.Link>
      </ContextMenu>
    ));

    return (
      <MessageContainer isSimple={isSimple} onContextMenu={menu}>
        {isSimple ? (
          <AvatarFiller />
        ) : (
          <MessageAvatar
            member={message.member ?? undefined}
            src={message.author?.avatar ?? undefined}
            user={message.author ?? undefined}
          />
        )}
        <MessageInner>
          {!isSimple && (
            <Flex align="center" gap="8px" mb="6px">
              <Name color={message.member?.roleColor}>
                {message.author?.name ?? 'Ghost'}
              </Name>
              {message.author?.category === 'BOT' && <BotTag />}
              <Timestamp time={new Date(message.timestamp)} />
            </Flex>
          )}
          <div>
            <Markdown content={message.content} />
            {message.editedTimestamp && <EditedNote>(edited)</EditedNote>}
          </div>
        </MessageInner>
      </MessageContainer>
    );
  },
);

export function GhostMessage() {
  return (
    <MessageContainer>
      <MessageAvatar />
      <MessageInner>
        <Flex align="center" gap="8px" mb="6px" opacity={0.5}>
          <Name>Cactus</Name>
        </Flex>

        <div style={{ opacity: '50%' }}>
          <Markdown content="testing ghost message" />
          <TypingDots />
        </div>
      </MessageInner>
    </MessageContainer>
  );
}
