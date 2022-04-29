import styled from 'styled-components';
import { Channel } from '../models';
import React, { useState } from 'react';
import {
  ContextMenuBase,
  ContextMenuLink,
  TreebarContext,
  useContextMenu,
} from './ContextMenu';
import { useMikoto } from '../api';
import { useSocketIO } from '../hooks/UseSocketIO';
import { ChannelIcon } from './ChannelIcon';

export const TreeContainer = styled.ul`
  height: 100%;
  list-style: none;
  margin: 0;
  padding: 10px;
  box-sizing: border-box;
`;

const TreeNodeElement = styled.li`
  font-size: 14px;
  height: 20px;
  padding: 6px 10px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.8);

  &:hover {
    background-color: ${(p) => p.theme.colors.N700};
  }
`;

interface TreeNodeProps extends React.HTMLAttributes<HTMLLIElement> {
  channel: Channel;
}

export function TreeNode({ channel, ...props }: TreeNodeProps) {
  const mikoto = useMikoto();
  const menu = useContextMenu(({ destroy }) => {
    return (
      <ContextMenuBase>
        <ContextMenuLink
          onClick={async () => {
            destroy();
            await mikoto.deleteChannel(channel.id);
          }}
        >
          Delete Channel
        </ContextMenuLink>
      </ContextMenuBase>
    );
  });

  return (
    <TreeNodeElement {...props} onContextMenu={menu}>
      <ChannelIcon />
      {channel.name}
    </TreeNodeElement>
  );
}

export function TreeBar({ onClick }: { onClick: (channel: Channel) => void }) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const mikoto = useMikoto();

  React.useEffect(() => {
    mikoto.getChannels().then(setChannels);
  }, [mikoto]);

  useSocketIO<Channel>(mikoto.io, 'channelCreate', (channel) => {
    setChannels((xs) => [...xs, channel]);
  });

  useSocketIO<Channel>(mikoto.io, 'channelDelete', (channel) => {
    setChannels((xs) => xs.filter((x) => x.id !== channel.id));
  });
  const contextMenu = useContextMenu(() => {
    return <TreebarContext />;
  });

  return (
    <TreeContainer onContextMenu={contextMenu}>
      {channels.map((x) => (
        <TreeNode channel={x} key={x.id} onClick={() => onClick(x)} />
      ))}
    </TreeContainer>
  );
}
