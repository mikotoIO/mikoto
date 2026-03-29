import { Box, Flex, Link } from '@chakra-ui/react';
import styled from '@emotion/styled';
import {
  faGears,
  faGlasses,
  faSprayCanSparkles,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { MikotoMessage } from '@mikoto-io/mikoto.js';
import { atom, useSetAtom } from 'jotai';
import { useSnapshot } from 'valtio/react';

import { ContextMenu, useContextMenu } from '@/components/ContextMenu';
import { MessageAvatar } from '@/components/atoms/MessageAvatar';
import { Markdown } from '@/components/molecules/markdown';
import { Tag } from '@/components/ui';
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
  min-width: 0;
  margin: 0;
  font-size: 14px;
  overflow-wrap: break-word;
  word-break: break-word;

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
  font-family: var(--font-heading);
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
}

export const messageEditIdState = atom<{ id: string; content: string } | null>(
  null,
);

export const messageEditState = atom<MikotoMessage | null>(null);

export const MessageItem = ({ message, isSimple }: MessageProps) => {
  const messageSnap = useSnapshot(message);
  const mikoto = useMikoto();
  const setEditState = useSetAtom(messageEditState);
  const menu = useContextMenu(() => (
    <ContextMenu>
      {message.authorId === mikoto.user.me!.id && (
        <ContextMenu.Link
          onClick={() => {
            setEditState(message);
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
                bg="blue.500"
                color="white"
              >
                <FontAwesomeIcon icon={faGlasses} />
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
        {messageSnap.attachments && messageSnap.attachments.length > 0 && (
          <Flex mt={2} gap={2} flexWrap="wrap">
            {messageSnap.attachments.map((attachment) => {
              const isImage = attachment.contentType.startsWith('image/');
              return (
                <Link
                  key={attachment.id}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  maxW={isImage ? '400px' : 'auto'}
                  _hover={{ textDecoration: 'none' }}
                >
                  {isImage ? (
                    <img
                      src={attachment.url}
                      alt={attachment.filename}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '300px',
                        borderRadius: '4px',
                      }}
                    />
                  ) : (
                    <Box
                      p={2}
                      bg="gray.700"
                      borderRadius="4px"
                      _hover={{ bg: 'gray.600' }}
                    >
                      <Flex align="center" gap={2}>
                        <Box fontSize="sm" fontWeight="medium">
                          {attachment.filename}
                        </Box>
                        <Box fontSize="xs" color="gray.400">
                          ({(attachment.size / 1024).toFixed(1)} KB)
                        </Box>
                      </Flex>
                    </Box>
                  )}
                </Link>
              );
            })}
          </Flex>
        )}
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
