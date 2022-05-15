import styled from 'styled-components';
import { useHover } from 'usehooks-ts';
import { useEffect, useRef, useState } from 'react';
import { Tooltip } from '@mantine/core';
import { useMikoto } from '../api';
import { Space } from '../models';

const ServerSidebarBase = styled.div`
  display: flex;
  flex-direction: column;
  background-color: ${(p) => p.theme.colors.N1000};
  align-items: center;
  width: 64px;
  height: 100%;
  padding-top: 10px;
`;

const ServerIconBase = styled.div`
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background-color: ${(p) => p.theme.colors.N800};
`;

function ServerIcon({ space }: { space: Space }) {
  const ref = useRef<HTMLDivElement>(null);
  const isHover = useHover(ref);
  return (
    <Tooltip label={space.name} opened={isHover} position="right" withArrow>
      <ServerIconBase ref={ref}>{space.name[0]}</ServerIconBase>
    </Tooltip>
  );
}

export function ServerSidebar() {
  const mikoto = useMikoto();
  const [spaces, setSpaces] = useState<Space[]>([]);
  useEffect(() => {
    mikoto.getSpaces().then(setSpaces);
  }, []);
  return (
    <ServerSidebarBase>
      {spaces.map((space) => (
        <ServerIcon space={space} key={space.id} />
      ))}
    </ServerSidebarBase>
  );
}
