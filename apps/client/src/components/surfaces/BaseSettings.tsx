import { faCog } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { TabName } from '@/components/tabs';
import { checkNonNull } from '@/utils/assertNonNull';
import { SettingSurface } from '@/views';

interface BaseSettingsSurfaceProps {
  categories: { code: string; tkey: string }[];
  switcher: (nav: string) => React.ReactNode;
  defaultNav: string;
}

export function BaseSettingsSurface({
  categories,
  switcher,
  defaultNav,
}: BaseSettingsSurfaceProps) {
  const [nav, setNav] = useState(defaultNav);
  const { t } = useTranslation();

  return (
    <SettingSurface.Container>
      <SettingSurface.Sidebar>
        {categories.map((c) => (
          <SettingSurface.Nav
            active={nav === c.code}
            onClick={() => {
              setNav(c.code);
            }}
            key={c.code}
          >
            {t(c.tkey)}
          </SettingSurface.Nav>
        ))}
      </SettingSurface.Sidebar>
      <TabName
        name={t(checkNonNull(categories.find((x) => x.code === nav)?.tkey))}
        icon={faCog}
      />
      {switcher(nav)}
    </SettingSurface.Container>
  );
}
