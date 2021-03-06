import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styled from 'styled-components';
import { Modal } from '@mantine/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { SpecialComponents } from 'react-markdown/lib/ast-to-react';
import { NormalComponents } from 'react-markdown/lib/complex-types';

import { ContextMenu, useContextMenu } from '../ContextMenu';
import { Message } from '../../models';
import { useMikoto } from '../../api';
import { MessageAvatar } from '../atoms/Avatar';

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

const MessageInner = styled.div`
  padding-top: 4px;
  font-size: 14px;

  pre {
    padding: 16px;
    margin: 0 4px;
    background-color: #282c34;
    color: #abb2bf;
    border-radius: 4px;

    & > div {
      padding: 0 !important;
    }
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

  ul,
  ol {
    padding-inline-start: 24px;
  }
`;

const Name = styled.div<{ color?: string }>`
  font-size: 14px;
  margin: 0 8px 0 0;
  color: ${(p) => p.color ?? 'currentColor'};
`;

const TimestampElement = styled.div`
  color: #9f9e9e;
  font-size: 12px;
`;

function Timestamp({ time }: { time: Date }) {
  return (
    <TimestampElement>
      {isToday(time) ? 'Today at ' : dateFormat.format(time)}{' '}
      {padTime(time.getHours())}:{padTime(time.getMinutes())}
    </TimestampElement>
  );
}

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

const markdownComponents: Partial<
  Omit<NormalComponents, keyof SpecialComponents> & SpecialComponents
> = {
  img({ src, alt }) {
    return <MessageImage src={src} alt={alt} />;
  },
};

function Markdown({ content }: { content: string }) {
  const co =
    isUrl(content) && isUrlImage(content)
      ? `![Image Embed](${content})`
      : content;

  return (
    <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
      {co}
    </ReactMarkdown>
  );
}

export default function MessageItem({ message, isSimple }: MessageProps) {
  const mikoto = useMikoto();

  const menu = useContextMenu(({ destroy }) => (
    <ContextMenu>
      <ContextMenu.Link
        onClick={async () => {
          destroy();
          await mikoto.deleteMessage(message.channelId, message.id);
        }}
      >
        Delete Message
      </ContextMenu.Link>
    </ContextMenu>
  ));

  return (
    <MessageContainer isSimple={isSimple} onContextMenu={menu}>
      {isSimple ? (
        <div style={{ width: '40px' }} />
      ) : (
        <MessageAvatar src={message.author?.avatar} user={message.author} />
      )}
      <MessageInner>
        {!isSimple && (
          <NameBox>
            <Name color="white">{message.author?.name ?? 'Ghost'}</Name>
            <Timestamp time={new Date(message.timestamp)} />
          </NameBox>
        )}
        <Markdown content={message.content} />
      </MessageInner>
    </MessageContainer>
  );
}
