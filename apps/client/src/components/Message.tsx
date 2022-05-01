import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styled from 'styled-components';
import { Message } from '../models';
import {
  ContextMenuBase,
  ContextMenuLink,
  useContextMenu,
} from './ContextMenu';
import { Modal } from '@mantine/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { useMikoto } from '../api';

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

function isUrl(s: string) {
  let url;

  try {
    url = new URL(s);
  } catch (_) {
    return false;
  }

  return url.protocol === 'http:' || url.protocol === 'https:';
}

function isUrlImage(url: string): boolean {
  return url.match(/\.(jpeg|jpg|gif|png)$/) !== null;
}

function padTime(n: number): string {
  return String(n).padStart(2, '0');
}

const MessageContainer = styled.div<{ isSimple?: boolean }>`
  display: grid;
  grid-template-columns: min-content auto;
  grid-gap: 16px;
  padding: ${(p) => (p.isSimple ? '0' : '8px')} 20px 4px;
  &:hover {
    background-color: rgba(0, 0, 0, 0.06);
  }

  p {
    margin: 0;
  }
`;

const Avatar = styled.img`
  margin-top: 4px;
  width: 40px;
  border-radius: 8px;
`;

const avatarUrl =
  'https://avatars.githubusercontent.com/u/16204510?s=400&u=6af0bd4744044945ae81e5ba5a57e0f2ecc38997';

const MessageInner = styled.div`
  padding-top: 4px;
  font-size: 14px;
  //p {
  //  margin-bottom: 8px;
  //}
  pre {
    padding: 16px;
    background-color: #29292b;
    border-radius: 4px;
  }
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
`;

const Name = styled.div<{ color?: string }>`
  font-size: 14px;
  margin: 0 8px 0 0;
  color: ${(p) => p.color ?? 'currentColor'};
`;

const Timestamp = styled.div`
  color: #9f9e9e;
  font-size: 12px;
`;

const NameBox = styled.div`
  display: flex;
  margin-bottom: 4px;
  & > * {
    align-self: flex-end;
  }
`;

interface MessageImageProps {
  src?: string;
  alt?: string;
}

const ImageModal = styled(Modal)`
  .mantine-Paper-root {
    background-color: transparent;
  }
`;

const ImageModalTitleLink = styled.a`
  color: #8b8b8b;
  transition-duration: 0.2s;

  &:hover {
    color: white;
    text-decoration: underline;
  }

  text-decoration: none;
  outline: none;
`;

function MessageImage({ src, alt }: MessageImageProps) {
  const [opened, setOpened] = useState(false);

  return (
    <>
      <ImageModal
        opened={opened}
        onClose={() => setOpened(false)}
        centered
        withCloseButton={false}
        title={
          <ImageModalTitleLink href={src} target="_blank">
            Source
            <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
          </ImageModalTitleLink>
        }
      >
        <img src={src} alt={alt} style={{ maxWidth: '100%' }} />
      </ImageModal>
      <img
        src={src}
        alt={alt}
        style={{ cursor: 'pointer' }}
        onClick={() => {
          setOpened(true);
        }}
      />
    </>
  );
}

interface MessageProps {
  message: Message;
  isSimple?: boolean;
}

export default function MessageItem({ message, isSimple }: MessageProps) {
  const menu = useContextMenu(({ destroy }) => (
    <ContextMenuBase>
      <ContextMenuLink
        onClick={async () => {
          destroy();
          await mikoto.deleteMessage(message.channelId, message.id);
        }}
      >
        Delete Message
      </ContextMenuLink>
    </ContextMenuBase>
  ));
  const mikoto = useMikoto();

  const time = new Date(message.timestamp);

  const content =
    isUrl(message.content) && isUrlImage(message.content)
      ? `![Image Embed](${message.content})`
      : message.content;

  return (
    <MessageContainer isSimple={isSimple} onContextMenu={menu}>
      {isSimple ? (
        <div style={{ width: '40px' }} />
      ) : (
        <Avatar src={avatarUrl} />
      )}
      <MessageInner>
        {!isSimple && (
          <NameBox>
            <Name color="white">{message.author?.name ?? 'Ghost'}</Name>
            <Timestamp>
              {isToday(time) ? 'Today at ' : dateFormat.format(time)}{' '}
              {padTime(time.getHours())}:{padTime(time.getMinutes())}
            </Timestamp>
          </NameBox>
        )}
        <ReactMarkdown
          children={content}
          components={{
            img({ src, alt }) {
              return <MessageImage src={src} alt={alt} />;
            },
          }}
          remarkPlugins={[remarkGfm]}
        />
      </MessageInner>
    </MessageContainer>
  );
}
