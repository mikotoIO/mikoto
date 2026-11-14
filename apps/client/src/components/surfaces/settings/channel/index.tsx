import { MikotoChannel } from '@mikoto-io/mikoto.js';
import { Hash, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSnapshot } from 'valtio/react';

import { Surface } from '@/components/Surface';
import {
  BaseSettingsSurface,
  type SettingsCategory,
} from '@/components/surfaces/BaseSettings';
import {
  EmptyState,
  Field,
  Form,
  Input,
  PageTitle,
  Section,
  toast,
} from '@/design';
import { useMikoto } from '@/hooks';
import { useErrorElement } from '@/hooks/useErrorElement';
import { SettingSurface } from '@/views';

import { ListEmpty, SaveBar } from '../common';

const CHANNEL_SETTING_CATEGORIES: SettingsCategory[] = [
  {
    code: 'general',
    tkey: 'channelSettings.general.title',
    icon: SlidersHorizontal,
  },
  {
    code: 'permissions',
    tkey: 'channelSettings.permissions.title',
    icon: ShieldCheck,
  },
];

const GENERAL_FORM_ID = 'channel-general-form';

function General({ channel }: { channel: MikotoChannel }) {
  const { t } = useTranslation();
  const error = useErrorElement();
  const form = useForm({ defaultValues: { name: channel.name } });
  const { isDirty, isSubmitting, errors } = form.formState;

  return (
    <SettingSurface>
      <PageTitle title={t('channelSettings.general.title')} />
      <Section>
        {error.el}
        <Form
          id={GENERAL_FORM_ID}
          onSubmit={form.handleSubmit(async (data) => {
            error.setError(null);
            try {
              const name = data.name.trim();
              await channel.edit({ name });
              form.reset({ name });
              toast({ title: 'Channel updated', type: 'success' });
            } catch (e) {
              error.setError(e);
            }
          })}
        >
          <Field label="Channel name" error={errors.name?.message}>
            <Input
              autoComplete="off"
              {...form.register('name', {
                validate: (v) => v.trim().length > 0 || 'Enter a channel name.',
              })}
            />
          </Field>
        </Form>
      </Section>
      <SaveBar
        dirty={isDirty}
        saving={isSubmitting}
        form={GENERAL_FORM_ID}
        onReset={() => form.reset()}
      />
    </SettingSurface>
  );
}

function Permissions() {
  const { t } = useTranslation();
  return (
    <SettingSurface>
      <PageTitle title={t('channelSettings.permissions.title')} />
      <ListEmpty
        icon={<ShieldCheck size={18} />}
        title="Channel permissions aren't available yet"
        description="For now, this channel follows the roles set in space settings."
      />
    </SettingSurface>
  );
}

function Switch({ nav, channel }: { nav: string; channel: MikotoChannel }) {
  switch (nav) {
    case 'general':
      return <General channel={channel} />;
    case 'permissions':
      return <Permissions />;
    default:
      return null;
  }
}

export function ChannelSettingsSurface({ channelId }: { channelId: string }) {
  const { t } = useTranslation();
  const mikoto = useMikoto();
  useSnapshot(mikoto.channels);
  const channel = mikoto.channels._get(channelId);

  if (!channel) {
    return (
      <Surface>
        <EmptyState
          icon={<Hash size={20} />}
          title="This channel no longer exists"
          description="It may have been deleted. Close this tab to continue."
        />
      </Surface>
    );
  }

  return (
    <BaseSettingsSurface
      title={`#${channel.name}`}
      groupLabel={t('channelSettings.title')}
      defaultNav="general"
      categories={CHANNEL_SETTING_CATEGORIES}
      switcher={(nav) => <Switch nav={nav} channel={channel} />}
    />
  );
}
