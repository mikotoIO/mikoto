import { SettingsView } from '../../../views/SettingsViewTemplate';
import { BaseSettingsSurface } from '../BaseSettingSurface';

const ACCOUNT_SETTING_CATEGORIES = [
  { code: 'general', tkey: 'channelSettings.general.title' },
  { code: 'permissions', tkey: 'channelSettings.permissions.title' },
];

function General() {
  return <SettingsView>Channel General</SettingsView>;
}

function Switch({ nav }: { nav: string }) {
  // TODO
  switch (nav) {
    case 'general':
      return <General />;
    default:
      return null;
  }
}

export function ChannelSettingsSurface() {
  return (
    <BaseSettingsSurface
      defaultNav="general"
      categories={ACCOUNT_SETTING_CATEGORIES}
      switcher={(nav) => <Switch nav={nav} />}
    />
  );
}
