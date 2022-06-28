import React from 'react';
import styled, { css } from 'styled-components';

const sharedCss = css`
  margin-top: 20px;

  resize: none;
  max-height: 300px;
  font-size: 14px;
  font-family: var(--main-font);
  border: none;
  padding: 16px;
  overflow-y: auto;
  word-wrap: break-word;
  &:focus {
    outline: none;
  }
  border-radius: 4px;

  grid-area: 1 / 1 / 2 / 2;
`;

const AutoGrow = styled.div`
  display: grid;
`;

const MessageInputDouble = styled.span`
  ${sharedCss};
  white-space: pre-line;
  visibility: hidden; ;
`;

const Outer = styled.div`
  margin: 0 16px 0;
`;

const Typing = styled.div`
  margin: 2px;
  font-size: 12px;
  height: 16px;
`;

const MessageInputBox = styled.textarea`
  ${sharedCss};
  color: white; // #dcddde
  background-color: ${(p) => p.theme.colors.N700};
`;

interface MessageProps {
  channelName: string;
  onMessageSend: (text: string) => void;
}

// the input box for messages.
export function MessageInput(props: MessageProps) {
  const ref = React.useRef<any>();
  const [text, setText] = React.useState('');

  const typing: string[] = []; // todo: implement typing states

  return (
    <Outer>
      <AutoGrow>
        <MessageInputBox
          placeholder={`Message #${props.channelName}`}
          rows={1}
          ref={ref}
          value={text}
          onChange={(x) => setText(x.target.value)}
          onKeyDown={(ev) => {
            if (ev.code === 'Enter' && !ev.shiftKey) {
              props.onMessageSend(text);
              setText('');
              ev.preventDefault();
            }
          }}
        />
        <MessageInputDouble>{text}</MessageInputDouble>
      </AutoGrow>
      <Typing>
        {typing.length !== 0 && (
          <div>
            {typing.join(', ')} {typing.length === 1 ? 'is' : 'are'} typing...
          </div>
        )}
      </Typing>
    </Outer>
  );
}
