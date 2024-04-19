import { faCog } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { TabName } from '@/components/TabBar';
import { SettingsView } from '@/views';

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
    <SettingsView.Container>
      <SettingsView.Sidebar>
        {categories.map((c) => (
          <SettingsView.Nav
            active={nav === c.code}
            onClick={() => {
              setNav(c.code);
            }}
            key={c.code}
          >
            {t(c.tkey)}
          </SettingsView.Nav>
        ))}
      </SettingsView.Sidebar>
      <TabName
        name={t(categories.find((x) => x.code === nav)?.tkey!)}
        icon={faCog}
      />
      {switcher(nav)}
    </SettingsView.Container>
  );
}
