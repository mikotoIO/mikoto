import styled from '@emotion/styled';
import { useAtom } from 'jotai';
import { useContext, useEffect } from 'react';

import { TabContext, TabNameProps, tabNameFamily } from '@/store/surface';

export function TabName({ name, icon, spaceId, spaceName }: TabNameProps) {
  const tabInfo = useContext(TabContext);
  const [tabName, setTabName] = useAtom(tabNameFamily(tabInfo.key));

  useEffect(() => {
    if (tabName.name !== name) {
      setTabName({
        ...tabName,
        name,
        icon,
        spaceId,
        spaceName,
      });
    }
  }, [name, tabName, setTabName, tabInfo.key, icon, spaceId, spaceName]);

  return <></>;
}

export const TabBarButton = styled.button`
  border: none;
  margin: 4px 0 4px;
  width: 32px;
  height: 32px;
  border-radius: 4px;

  color: var(--chakra-colors-gray-300);
  background-color: transparent;
  &:hover {
    background-color: var(--chakra-colors-gray-600);
  }
`;
