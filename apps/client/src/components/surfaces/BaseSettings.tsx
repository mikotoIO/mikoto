import { type LucideIcon, Settings } from 'lucide-react';
import { Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Surface } from '@/components/Surface';
import { SettingsPageSkeleton } from '@/components/surfaces/settings/common';
import { TabName } from '@/components/tabs';
import {
  DelayedFallback,
  PaneHeader,
  RegionErrorBoundary,
  Select,
} from '@/design';
import { SettingSurface } from '@/views';

export interface SettingsCategory {
  code: string;
  tkey: string;
  icon?: LucideIcon;
}

interface BaseSettingsSurfaceProps {
  /** Shown in the pane header, e.g. "Account settings". */
  title: string;
  /** Sentence-case group label above the nav rows ("Account", a space name). */
  groupLabel?: string;
  categories: SettingsCategory[];
  switcher: (nav: string) => React.ReactNode;
  defaultNav: string;
}

export function BaseSettingsSurface({
  title,
  groupLabel,
  categories,
  switcher,
  defaultNav,
}: BaseSettingsSurfaceProps) {
  const [nav, setNav] = useState(defaultNav);
  const { t } = useTranslation();

  const current = categories.find((x) => x.code === nav) ?? categories[0];
  const currentName = current ? t(current.tkey) : title;

  return (
    <Surface>
      <TabName name={currentName} icon={Settings} />
      <PaneHeader
        icon={<Settings size={16} aria-hidden />}
        title={title}
        topic={currentName}
      />
      <SettingSurface.Container>
        <SettingSurface.Sidebar>
          {groupLabel && (
            <SettingSurface.NavLabel>{groupLabel}</SettingSurface.NavLabel>
          )}
          {categories.map((c) => {
            const Icon = c.icon;
            return (
              <SettingSurface.Nav
                key={c.code}
                active={current?.code === c.code}
                icon={Icon && <Icon size={15} />}
                onClick={() => setNav(c.code)}
              >
                {t(c.tkey)}
              </SettingSurface.Nav>
            );
          })}
        </SettingSurface.Sidebar>
        <SettingSurface.Main
          compactNav={
            <Select
              aria-label="Settings section"
              value={current?.code}
              onChange={(e) => setNav(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.code} value={c.code}>
                  {t(c.tkey)}
                </option>
              ))}
            </Select>
          }
        >
          <RegionErrorBoundary what={currentName} resetKeys={[current?.code]}>
            <Suspense
              fallback={
                <SettingSurface>
                  <DelayedFallback>
                    <SettingsPageSkeleton label={currentName} />
                  </DelayedFallback>
                </SettingSurface>
              }
            >
              {current && switcher(current.code)}
            </Suspense>
          </RegionErrorBoundary>
        </SettingSurface.Main>
      </SettingSurface.Container>
    </Surface>
  );
}
