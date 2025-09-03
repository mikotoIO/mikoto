import { Box, Button, Flex, Heading, Input, Textarea } from '@chakra-ui/react';
import { MikotoChannel } from '@mikoto-io/mikoto.js';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

import { BaseSettingsSurface } from '@/components/surfaces/BaseSettings';
import { Field } from '@/components/ui';
import { useMikoto } from '@/hooks';
import { Form, Triselector } from '@/ui';
import { SettingSurface } from '@/views';

const ACCOUNT_SETTING_CATEGORIES = [
  { code: 'general', tkey: 'channelSettings.general.title' },
  { code: 'permissions', tkey: 'channelSettings.permissions.title' },
];

function General({ channel }: { channel: MikotoChannel }) {
  const form = useForm({
    defaultValues: {
      name: channel.name,
      description: '',
    },
  });
  return (
    <SettingSurface>
      <Heading>Overview</Heading>
      <Form
        onSubmit={form.handleSubmit(async (data) => {
          await channel.edit(data);
          toast.success('Updated channel');
        })}
      >
        <Field label="Channel Name">
          <Input {...form.register('name')} />
        </Field>
        <Field label="Description">
          <Textarea h={200} {...form.register('description')} />
        </Field>

        <Button colorPalette="primary" type="submit">
          Save
        </Button>
      </Form>
    </SettingSurface>
  );
}

function Permissions({ channel: _channel }: { channel: MikotoChannel }) {
  return (
    <SettingSurface>
      <Heading>Permissions</Heading>
      <Box py={4}>
        <Flex justify="space-between">
          <Heading as="h2" fontSize="xl" m={0}>
            PermName
          </Heading>
          <Triselector />
        </Flex>
        <Box color="gray.200">Description of the perm goes here.</Box>
      </Box>
    </SettingSurface>
  );
}

function Switch({ nav, channel }: { nav: string; channel: MikotoChannel }) {
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
  const channel = mikoto.channels._get(channelId)!;
  return (
    <BaseSettingsSurface
      defaultNav="general"
      categories={ACCOUNT_SETTING_CATEGORIES}
      switcher={(nav) => <Switch nav={nav} channel={channel} />}
    />
  );
}
