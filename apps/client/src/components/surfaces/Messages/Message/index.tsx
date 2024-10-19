import { Box, Flex, Tag } from '@chakra-ui/react';
import styled from '@emotion/styled';
import { MikotoMessage } from '@mikoto-io/mikoto.js';
import { makeAutoObservable, runInAction } from 'mobx';
import { atom } from 'recoil';
import { useSnapshot } from 'valtio/react';

import { ContextMenu, useContextMenu } from '@/components/ContextMenu';
import { MessageAvatar } from '@/components/atoms/MessageAvatar';
import { Markdown } from '@/components/molecules/markdown';
import { useMikoto } from '@/hooks';
import { TypingDots } from '@/ui';

import { Timestamp } from './Timestamp';

const MessageContainer = styled.div<{ isSimple?: boolean }>`
  margin: 0;
  display: flex;
  min-height: 20px;
  gap: 16px;
  padding: 2px 20px 6px;
  padding-top: ${(p) => (p.isSimple ? '2px' : '8px')};
  &:hover {
    background-color: rgba(0, 0, 0, 0.06);
  }

  p {
    margin: 0;
  }

  .avatar {
    margin-top: 4px;
  }
`;

const MessageInner = styled.div`
  flex: 1;
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

interface MessageProps {
  message: MikotoMessage;
  isSimple?: boolean;
  editState: MessageEditState;
}

export const messageEditIdState = atom<{ id: string; content: string } | null>({
  key: 'messageEditId',
  default: null,
});

export class MessageEditState {
  message: MikotoMessage | null = null;
  constructor() {
    makeAutoObservable(this);
  }
}

export const MessageItem = ({ message, editState, isSimple }: MessageProps) => {
  const messageSnap = useSnapshot(message);
  const mikoto = useMikoto();
  const menu = useContextMenu(() => (
    <ContextMenu>
      {message.authorId === mikoto.user.me!.id && (
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
      <ContextMenu.Link>Reply to Message</ContextMenu.Link>
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
        <Box m={0} w={10} />
      ) : (
        <MessageAvatar
          member={message.member ?? undefined}
          src={messageSnap.author?.avatar ?? undefined}
          user={messageSnap.author ?? undefined}
        />
      )}
      <MessageInner>
        {!isSimple && (
          <Flex align="center" gap="8px" mb="6px">
            <Name color={messageSnap.member?.roleColor}>
              {messageSnap.author?.name ?? 'Ghost'}
            </Name>

            {messageSnap.author?.category === 'BOT' && (
              <Tag
                size="sm"
                fontSize="2xs"
                px={1}
                minH="18px"
                variant="solid"
                bg="primary"
                color="white"
              >
                BOT
              </Tag>
            )}
            <Timestamp time={new Date(messageSnap.timestamp)} />
          </Flex>
        )}
        <div>
          <Markdown content={messageSnap.content} />
          {message.editedTimestamp && (
            <Box as="span" ml={1} color="gray.400" fontSize="xs">
              (edited)
            </Box>
          )}
        </div>
      </MessageInner>
    </MessageContainer>
  );
};

export function GhostMessage() {
  return (
    <MessageContainer>
      <MessageAvatar />
      <MessageInner>
        <Flex align="center" gap="8px" mb="6px" opacity={0.5}>
          <Name>Cactus</Name>
        </Flex>

        <Box opacity={0.5}>
          <Markdown content="testing ghost message" />
          <TypingDots />
        </Box>
      </MessageInner>
    </MessageContainer>
  );
}
