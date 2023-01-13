import { Button } from '@mantine/core';
import { ClientChannel, ClientMessage } from 'mikotojs';
import React, { useEffect, useRef, useState } from 'react';
import { useAsync } from 'react-async-hook';
import styled from 'styled-components';

import { TabName } from '../components/TabBar';
import { ViewContainer } from '../components/ViewContainer';
import { Spinner } from '../components/atoms/Spinner';
import MessageItem from '../components/molecules/Message';
import { MessageEditor } from '../components/molecules/MessageEditor';
import { useMikoto } from '../hooks';
import { Channel } from '../models';
import { CurrentSpaceContext } from '../store';

const Messages = styled.div`
  overflow-y: auto;
  flex-grow: 1;
`;

const MessagesLoading = styled.div`
  overflow-y: auto;
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
`;

interface MessageViewProps {
  channel: Channel;
}

function isMessageSimple(message: ClientMessage, prevMessage: ClientMessage) {
  return (
    prevMessage &&
    prevMessage.author?.id === message.author?.id &&
    new Date(message.timestamp).getTime() -
      new Date(prevMessage.timestamp).getTime() <
      5 * 60 * 1000
  );
}

function useOnScreen(ref: React.RefObject<HTMLElement>) {
  const [isIntersecting, setIntersecting] = useState(false);
  const observer = new IntersectionObserver(([entry]) =>
    setIntersecting(entry.isIntersecting),
  );
  useEffect(() => {
    observer.observe(ref.current!);
    // Remove the observer as soon as the component is unmounted
    return () => {
      observer.disconnect();
    };
  }, []);

  return isIntersecting;
}

function Paginator({ paginate }: { paginate: () => Promise<boolean> }) {
  const paginationRef = useRef<HTMLButtonElement>(null);
  const toPaginate = useOnScreen(paginationRef);
  // const [isPaginating, setIsPaginating] = useState(false);
  const [paginationState, setPaginationState] = useState<
    'WAITING' | 'PAGINATING' | 'COMPLETED'
  >('WAITING');

  useEffect(() => {
    if (toPaginate && paginationState === 'WAITING') {
      setPaginationState('PAGINATING');
      console.log('lol');
      paginate().then((x) => {
        setPaginationState(x ? 'COMPLETED' : 'WAITING');
      });
    }
  }, [toPaginate, paginationState]);

  return (
    <>
      {paginationState !== 'COMPLETED' && (
        <Button ref={paginationRef} onClick={paginate}>
          {toPaginate ? 'On Screen' : 'Load More'}
        </Button>
      )}
    </>
  );
}

function RealMessageView({ channel }: { channel: ClientChannel }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [scrollBottom, setScrollBottom] = useState(false);
  useEffect(() => {
    if (scrollBottom && ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
      setScrollBottom(false);
    }
  });
  const mikoto = useMikoto();

  useEffect(() => {
    mikoto.ack(channel.id).then();
  }, [channel.id]);

  const [msgs, setMsgs] = useState<ClientMessage[] | null>(null);
  useEffect(() => {
    channel.messages.fetch().then(setMsgs);
  }, [channel.id]);

  const createFn = (x: ClientMessage) => {
    setMsgs((xs) => {
      if (xs === null) return null;
      return [...xs, x];
    });
    setScrollBottom(true);
  };

  const deleteFn = (x: ClientMessage) => {
    setMsgs((xs) => {
      if (xs === null) return null;
      return xs.filter((y) => y.id !== x.id);
    });
  };

  useEffect(() => {
    channel.messages.on('create', createFn);
    channel.messages.on('delete', deleteFn);
    return () => {
      channel.messages.off('create', createFn);
      channel.messages.off('delete', deleteFn);
    };
  }, [channel.id]);

  // const messageDelta = useDelta(channel.messages, [channel.id]);
  // // messages really do not fit the delta model, so just write it raw
  //
  // const messages = messageDelta.data;
  return (
    <ViewContainer key={channel.id}>
      <TabName name={channel.name} />
      {msgs === null ? (
        <MessagesLoading>
          <Spinner />
        </MessagesLoading>
      ) : (
        <Messages ref={ref}>
          <Paginator
            paginate={async () => {
              if (msgs.length > 0) {
                const m = await channel.getMessages(msgs[0].id);
                setMsgs([...m, ...msgs]);
                return m.length === 0; // it's time to stop
              }
              return true;
            }}
          />
          {msgs.map((msg, idx) => (
            <MessageItem
              key={msg.id}
              message={msg}
              isSimple={isMessageSimple(msg, msgs[idx - 1])}
            />
          ))}
        </Messages>
      )}
      <MessageEditor
        placeholder={`Message #${channel.name}`}
        onSubmit={async (msg) => {
          await channel.sendMessage(msg);
        }}
      />
    </ViewContainer>
  );
}

export function MessageView({ channel }: MessageViewProps) {
  const mikoto = useMikoto();
  const { result: mChannel, error } = useAsync(
    (id: string) => mikoto.getChannel(id),
    [channel.id],
  );
  if (error) throw error;
  if (!mChannel) return <div>loading</div>;

  return (
    <CurrentSpaceContext.Provider value={mChannel.space}>
      <RealMessageView channel={mChannel} />
    </CurrentSpaceContext.Provider>
  );
}
