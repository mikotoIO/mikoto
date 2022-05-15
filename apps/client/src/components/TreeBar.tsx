import styled from 'styled-components';
import React, { useState } from 'react';
import { atom, useRecoilValue } from 'recoil';

import { Channel } from '../models';
import {
  ContextMenuBase,
  ContextMenuLink,
  TreebarContext,
  useContextMenu,
} from './ContextMenu';
import { useMikoto } from '../api';
import { useSocketIO } from '../hooks/useSocketIO';
import { ChannelIcon } from './ChannelIcon';
import constants from '../constants';

export const TreeContainer = styled.ul`
  list-style: none;
  margin: 0;
  padding: 10px;
  flex: 1;
  overflow-y: auto;
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
  const menu = useContextMenu(({ destroy }) => (
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
  ));

  return (
    <TreeNodeElement {...props} onContextMenu={menu}>
      <ChannelIcon />
      {channel.name}
    </TreeNodeElement>
  );
}

interface TreeBarProps {
  onClick: (channel: Channel, ev: React.MouseEvent) => void;
}

const treebarSpaceIdState = atom<string | null>({
  key: 'treebarSpaceId',
  default: constants.defaultSpace,
});

export function TreeBar({ onClick }: TreeBarProps) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const spaceId = useRecoilValue(treebarSpaceIdState);
  const mikoto = useMikoto();

  React.useEffect(() => {
    mikoto.getChannels(spaceId!).then(setChannels);
  }, [mikoto]);

  useSocketIO<Channel>(mikoto.io, 'channelCreate', (channel) => {
    setChannels((xs) => [...xs, channel]);
  });

  useSocketIO<Channel>(mikoto.io, 'channelDelete', (channel) => {
    setChannels((xs) => xs.filter((x) => x.id !== channel.id));
  });
  const contextMenu = useContextMenu(() => <TreebarContext />);

  return (
    <TreeContainer onContextMenu={contextMenu}>
      {channels.map((x) => (
        <TreeNode channel={x} key={x.id} onClick={(ev) => onClick(x, ev)} />
      ))}
    </TreeContainer>
  );
}
