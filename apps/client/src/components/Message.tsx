import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from "remark-gfm";
import styled from 'styled-components';
import {Message} from "../models";
import {useRecoilState} from "recoil";
import {contextMenuState} from "./ContextMenu";

const dateFormat = new Intl.DateTimeFormat('en', {day: 'numeric', month: 'long', year: 'numeric'});

function isToday(someDate: Date): boolean {
  const today = new Date()
  return someDate.getDate() === today.getDate() &&
    someDate.getMonth() === today.getMonth() &&
    someDate.getFullYear() === today.getFullYear()
}

function padTime(n: number): string {
  return String(n).padStart(2, '0')
}

const MessageContainer = styled.div<{isSimple?: boolean}>`
  display: grid;
  grid-template-columns: min-content auto;
  grid-gap: 16px;
  padding: ${p => p.isSimple ? '0' : '8px'} 20px 4px;
  &:hover {
    background-color: rgba(0, 0, 0, 0.06)
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

const avatarUrl = 'https://avatars.githubusercontent.com/u/16204510?s=400&u=6af0bd4744044945ae81e5ba5a57e0f2ecc38997';

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
    color: #00AFF4;
    &:not(:hover) {
      text-decoration: none;
    }
  }
  img {
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

interface MessageProps {
  message: Message;
  isSimple?: boolean;
}

export default function MessageItem({ message, isSimple }: MessageProps) {
  const [, setContextMenu] = useRecoilState(contextMenuState);

  const time = new Date(message.timestamp);
  return (
    <MessageContainer
      isSimple={isSimple}
      onContextMenu={e => {
      e.preventDefault();
      setContextMenu({
        position: {top: e.clientY, left: e.clientX},
        variant: { kind: 'message', message }
      });
    }}>
      {isSimple ? <div style={{ width: '40px' }}/> : <Avatar src={avatarUrl}/>}
      <MessageInner>
        {!isSimple && <NameBox>
          <Name color="white">{message.author?.name ?? 'Ghost'}</Name>
          <Timestamp>
            {isToday(time) ? 'Today at ' : dateFormat.format(time)}
            {' '}
            {padTime(time.getHours())}:{padTime(time.getMinutes())}
          </Timestamp>
        </NameBox>}
        <ReactMarkdown
          children={message.content}
          remarkPlugins={[remarkGfm]}
        />
      </MessageInner>
    </MessageContainer>
  );
}
