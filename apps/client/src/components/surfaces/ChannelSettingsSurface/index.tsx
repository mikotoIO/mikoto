import {
  Form,
  Heading,
  Input,
  Button,
  Box,
  Flex,
  TextArea,
} from '@mikoto-io/lucid';
import { ClientChannel } from 'mikotojs';
import { useForm } from 'react-hook-form';

import { useMikoto } from '../../../hooks';
import { SettingsView } from '../../../views/SettingsViewTemplate';
import { Triselector } from '../../atoms/Triselect';
import { BaseSettingsSurface } from '../BaseSettingSurface';

const ACCOUNT_SETTING_CATEGORIES = [
  { code: 'general', tkey: 'channelSettings.general.title' },
  { code: 'permissions', tkey: 'channelSettings.permissions.title' },
];

function General({ channel }: { channel: ClientChannel }) {
  const mikoto = useMikoto();
  const form = useForm({
    defaultValues: {
      name: channel.name,
      description: '',
    },
  });
  return (
    <SettingsView>
      <Heading>Overview</Heading>
      <Form
        onSubmit={form.handleSubmit(async (data) => {
          await channel.update(data);
        })}
      >
        <Input labelName="Channel Name" {...form.register('name')} />
        <TextArea
          labelName="Description"
          h={200}
          {...form.register('description')}
        />
        <Button variant="primary" type="submit">
          Save
        </Button>
      </Form>
    </SettingsView>
  );
}

function Permissions({ channel }: { channel: ClientChannel }) {
  return (
    <SettingsView>
      <Heading>Permissions</Heading>
      <Box p={{ y: 16 }}>
        <Flex style={{ justifyContent: 'space-between' }}>
          <Heading as="h3" m={0}>
            PermName
          </Heading>
          <Triselector />
        </Flex>
        <Box txt="N300">Description of the perm goes here.</Box>
      </Box>
    </SettingsView>
  );
}

function Switch({ nav, channel }: { nav: string; channel: ClientChannel }) {
  // TODO
  switch (nav) {
    case 'general':
      return <General channel={channel} />;
    case 'permissions':
      return <Permissions channel={channel} />;
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
