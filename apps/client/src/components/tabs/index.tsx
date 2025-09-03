import styled from '@emotion/styled';
import { useContext, useEffect } from 'react';
import { useRecoilState } from 'recoil';

import { TabContext, TabNameProps, tabNameFamily } from '@/store/surface';

export function TabName({ name, icon }: TabNameProps) {
  const tabInfo = useContext(TabContext);
  const [tabName, setTabName] = useRecoilState(tabNameFamily(tabInfo.key));

  useEffect(() => {
    if (tabName.name !== name) {
      setTabName({
        ...tabName,
        name,
        icon,
      });
    }
  }, [name, tabName, setTabName, tabInfo.key, icon]);

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <></>;
}

export const TabBarButton = styled.button`
  border: none;
  margin: 4px 8px 0;
  width: 32px;
  height: 32px;
  border-radius: 4px;

  color: var(--chakra-colors-gray-300);
  background-color: transparent;
  &:hover {
    background-color: var(--chakra-colors-gray-700);
  }
`;
