import { Flex } from '@mikoto-io/lucid';
import { ClientMessage } from 'mikotojs';
import { observer } from 'mobx-react-lite';
import styled from 'styled-components';

import { useMikoto } from '../../hooks';
import { ContextMenu, useContextMenu } from '../ContextMenu';
import { BotTag } from '../atoms/BotTag';
import { MessageAvatar } from '../atoms/MessageAvatar';
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
    background-color: var(--N1000);
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

  p:not(:first-child),
  pre:not(:first-child) {
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

const StyledTimestamp = styled.div`
  color: #9f9e9e;
  font-size: 12px;
  padding-left: 8px;
`;

function Timestamp({ time }: { time: Date }) {
  return (
    <StyledTimestamp>
      {isToday(time) ? 'Today at ' : dateFormat.format(time)}{' '}
      {padTime(time.getHours())}:{padTime(time.getMinutes())}
    </StyledTimestamp>
  );
}

const NameBox = styled(Flex)`
  margin-bottom: 4px;
  & > * {
    align-self: flex-end;
  }
`;

const AvatarFiller = styled.div`
  margin: 0;
  width: 40px;
`;

interface MessageProps {
  message: ClientMessage;
  isSimple?: boolean;
}

export const MessageItem = observer(({ message, isSimple }: MessageProps) => {
  const mikoto = useMikoto();

  const menu = useContextMenu(() => (
    <ContextMenu>
      <ContextMenu.Link
        onClick={async () => {
          await mikoto.client.messages.delete(message.channelId, message.id);
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
          <NameBox>
            <Name color={message.member?.roleColor}>
              {message.author?.name ?? 'Ghost'}
            </Name>
            {message.author?.category === 'BOT' && <BotTag />}
            <Timestamp time={new Date(message.timestamp)} />
          </NameBox>
        )}
        <Markdown content={message.content} />
      </MessageInner>
    </MessageContainer>
  );
});
