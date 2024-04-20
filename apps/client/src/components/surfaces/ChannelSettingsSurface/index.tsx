import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Textarea,
} from '@chakra-ui/react';
import { ClientChannel } from 'mikotojs';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

import { BaseSettingsSurface } from '@/components/surfaces/BaseSettingSurface';
import { useMikoto } from '@/hooks';
import { Form, Triselector } from '@/ui';
import { SettingsView } from '@/views';

const ACCOUNT_SETTING_CATEGORIES = [
  { code: 'general', tkey: 'channelSettings.general.title' },
  { code: 'permissions', tkey: 'channelSettings.permissions.title' },
];

function General({ channel }: { channel: ClientChannel }) {
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
          toast.success('Updated channel');
        })}
      >
        <FormControl>
          <FormLabel>Channel Name</FormLabel>
          <Input {...form.register('name')} />
        </FormControl>
        <FormControl>
          <FormLabel>Description</FormLabel>
          <Textarea h={200} {...form.register('description')} />
        </FormControl>

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
      <Box py={4}>
        <Flex justify="space-between">
          <Heading as="h2" fontSize="xl" m={0}>
            PermName
          </Heading>
          <Triselector />
        </Flex>
        <Box color="gray.200">Description of the perm goes here.</Box>
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
