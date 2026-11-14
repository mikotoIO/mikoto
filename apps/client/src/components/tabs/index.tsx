import { useSetAtom } from 'jotai';
import { use, useEffect } from 'react';

import { TabContext, TabNameProps, tabNameFamily } from '@/store/surface';

/**
 * Declares the current tab's name and icon (shown in the dock's tab strip).
 * Render it anywhere inside a surface; it renders nothing itself.
 */
export function TabName({ name, icon, spaceId, spaceName }: TabNameProps) {
  const tabInfo = use(TabContext);
  const setTabName = useSetAtom(tabNameFamily(tabInfo.key));

  useEffect(() => {
    setTabName((current) =>
      current.name === name &&
      current.icon === icon &&
      current.spaceId === spaceId &&
      current.spaceName === spaceName
        ? current
        : { ...current, name, icon, spaceId, spaceName },
    );
  }, [name, icon, spaceId, spaceName, setTabName]);

  return null;
}
