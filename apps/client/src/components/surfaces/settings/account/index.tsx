import {
  Bell,
  Bot,
  Languages,
  Link,
  Palette,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSnapshot } from 'valtio/react';

import { AvatarEditor } from '@/components/molecules/AvatarEditor';
import {
  BaseSettingsSurface,
  type SettingsCategory,
} from '@/components/surfaces/BaseSettings';
import {
  Field,
  Form,
  Input,
  PageTitle,
  Section,
  Textarea,
  toast,
} from '@/design';
import { uploadFile } from '@/functions/fileUpload';
import { useMikoto } from '@/hooks';
import { useErrorElement } from '@/hooks/useErrorElement';
import { SettingSurface } from '@/views';

import { HandleSection } from '../HandleForm';
import { ListEmpty, SaveBar, SettingsPageSkeleton } from '../common';
import { BotsSurface } from './bots';
import styles from './index.module.css';
import { LanguageSurface } from './language';
import { NotificationSurface } from './notification';
import { SafetySurface } from './safety';
import { ThemesSubsurface } from './themes';

const PROFILE_FORM_ID = 'account-profile-form';

function Overview() {
  const { t } = useTranslation();
  const mikoto = useMikoto();
  const userSnap = useSnapshot(mikoto.user);
  const me = userSnap.me;

  if (!me || !mikoto.user.me) {
    return (
      <SettingSurface>
        <SettingsPageSkeleton label={t('accountSettings.general.title')} />
      </SettingSurface>
    );
  }
  const user = mikoto.user.me;

  return (
    <SettingSurface>
      <PageTitle
        title={t('accountSettings.general.title')}
        description="How you appear to people in your spaces and DMs."
      />
      <div className={styles.card}>
        <div className={styles.banner} aria-hidden />
        <div className={styles.identity}>
          <div className={styles.avatarRing}>
            <AvatarEditor
              avatar={me.avatar ?? undefined}
              onDrop={async (file) => {
                const { data } = await uploadFile('/avatar', file);
                await mikoto.rest['user.update']({ avatar: data.url }, {});
                user.avatar = data.url;
              }}
            />
          </div>
          <div className={styles.names}>
            <span className={styles.displayName}>{me.name}</span>
            {me.handle && <span className={styles.handle}>@{me.handle}</span>}
          </div>
        </div>
      </div>

      <ProfileForm
        name={me.name}
        description={me.description ?? ''}
        onSaved={(values) => {
          user.name = values.name;
          user.description = values.description;
        }}
      />

      <HandleSection
        current={me.handle}
        subject="your"
        description='Your unique identifier. Use a simple username like "hayley", or verify a domain you own like "hayley.moe".'
        placeholder="your-name or your-domain.com"
        setHandle={async (handle) => {
          await mikoto.rest['user.setHandle']({ handle }, {});
          user.handle = handle;
        }}
        releaseHandle={async () => {
          await mikoto.rest['user.deleteHandle'](undefined, {});
          user.handle = null;
        }}
        startVerification={(handle) =>
          mikoto.rest['user.startHandleVerification']({ handle }, {})
        }
        completeVerification={async (handle) => {
          const result = await mikoto.rest['user.completeHandleVerification'](
            { handle },
            {},
          );
          if (result.success) user.handle = handle;
          return result;
        }}
      />
    </SettingSurface>
  );
}

interface ProfileValues {
  name: string;
  description: string;
}

function ProfileForm({
  name,
  description,
  onSaved,
}: ProfileValues & { onSaved: (values: ProfileValues) => void }) {
  const mikoto = useMikoto();
  const error = useErrorElement();
  const form = useForm<ProfileValues>({
    defaultValues: { name, description },
  });
  const { isDirty, isSubmitting, errors } = form.formState;

  return (
    <>
      <Section title="Profile details">
        {error.el}
        <Form
          id={PROFILE_FORM_ID}
          onSubmit={form.handleSubmit(async (values) => {
            error.setError(null);
            const dirty = form.formState.dirtyFields;
            try {
              await mikoto.rest['user.update'](
                {
                  ...(dirty.name ? { name: values.name.trim() } : {}),
                  ...(dirty.description
                    ? { description: values.description }
                    : {}),
                },
                {},
              );
              const saved = { ...values, name: values.name.trim() };
              onSaved(saved);
              form.reset(saved);
              toast({ title: 'Profile saved', type: 'success' });
            } catch (e) {
              error.setError(e);
            }
          })}
        >
          <Field label="Display name" error={errors.name?.message}>
            <Input
              autoComplete="off"
              {...form.register('name', {
                validate: (v) => v.trim().length > 0 || 'Enter a display name.',
              })}
            />
          </Field>
          <Field label="Bio" description="Markdown is supported.">
            <Textarea
              className={styles.bio}
              placeholder="A little about yourself: what you like, what you're working on, where else to find you."
              autoComplete="off"
              {...form.register('description')}
            />
          </Field>
        </Form>
      </Section>
      {/* Outside the Section so it stays stuck for the rest of the page. */}
      <SaveBar
        dirty={isDirty}
        saving={isSubmitting}
        form={PROFILE_FORM_ID}
        onReset={() => form.reset()}
      />
    </>
  );
}

function ConnectionsSurface() {
  const { t } = useTranslation();
  return (
    <SettingSurface>
      <PageTitle title={t('accountSettings.connections.title')} />
      <ListEmpty
        icon={<Link size={18} />}
        title="No connections yet"
        description="Linking other accounts isn't available yet. When it is, you'll set it up here."
      />
    </SettingSurface>
  );
}

function Switch({ nav }: { nav: string }) {
  switch (nav) {
    case 'general':
      return <Overview />;
    case 'bots':
      return <BotsSurface />;
    case 'language':
      return <LanguageSurface />;
    case 'notifications':
      return <NotificationSurface />;
    case 'themes':
      return <ThemesSubsurface />;
    case 'safety':
      return <SafetySurface />;
    case 'connections':
      return <ConnectionsSurface />;
    default:
      return null;
  }
}

const ACCOUNT_SETTING_CATEGORIES: SettingsCategory[] = [
  { code: 'general', tkey: 'accountSettings.general.title', icon: UserRound },
  { code: 'themes', tkey: 'accountSettings.themes.title', icon: Palette },
  {
    code: 'notifications',
    tkey: 'accountSettings.notifications.title',
    icon: Bell,
  },
  {
    code: 'language',
    tkey: 'accountSettings.language.title',
    icon: Languages,
  },
  {
    code: 'safety',
    tkey: 'accountSettings.safety.title',
    icon: ShieldCheck,
  },
  { code: 'bots', tkey: 'accountSettings.bots.title', icon: Bot },
  {
    code: 'connections',
    tkey: 'accountSettings.connections.title',
    icon: Link,
  },
];

export function AccountSettingsSurface() {
  const { t } = useTranslation();
  return (
    <BaseSettingsSurface
      title={t('accountSettings.title')}
      groupLabel="Account"
      defaultNav="general"
      categories={ACCOUNT_SETTING_CATEGORIES}
      switcher={(nav) => <Switch nav={nav} />}
    />
  );
}
