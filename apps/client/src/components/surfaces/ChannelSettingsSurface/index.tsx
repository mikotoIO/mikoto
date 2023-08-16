import { Form, Heading, Input } from '@mikoto-io/lucid';
import { ClientChannel } from 'mikotojs';

import { useMikoto } from '../../../hooks';
import { SettingsView } from '../../../views/SettingsViewTemplate';
import { BaseSettingsSurface } from '../BaseSettingSurface';

const ACCOUNT_SETTING_CATEGORIES = [
  { code: 'general', tkey: 'channelSettings.general.title' },
  { code: 'permissions', tkey: 'channelSettings.permissions.title' },
];

function General({ channel }: { channel: ClientChannel }) {
  return (
    <SettingsView>
      <Heading>Overview</Heading>
      <Form>
        <Input labelName="Channel Name" />
      </Form>
    </SettingsView>
  );
}

function Switch({ nav, channel }: { nav: string; channel: ClientChannel }) {
  // TODO
  switch (nav) {
    case 'general':
      return <General channel={channel} />;
    default:
      return null;
  }
}

export function ChannelSettingsSurface({ channelId }: { channelId: string }) {
  const mikoto = useMikoto();
  const channel = mikoto.channels.get(channelId)!;
  return (
    <BaseSettingsSurface
      defaultNav="general"
      categories={ACCOUNT_SETTING_CATEGORIES}
      switcher={(nav) => <Switch nav={nav} channel={channel} />}
    />
  );
}
