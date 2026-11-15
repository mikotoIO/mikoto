import { MikotoSpace, type SpaceVisibility } from '@mikoto-io/mikoto.js';
import { useSetAtom } from 'jotai';
import { Ban, Bot, Info, Mail, Shield, Smile, Users } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSnapshot } from 'valtio/react';

import { modalState } from '@/components/ContextMenu';
import { Surface } from '@/components/Surface';
import { AvatarEditor } from '@/components/molecules/AvatarEditor';
import {
  BaseSettingsSurface,
  type SettingsCategory,
} from '@/components/surfaces/BaseSettings';
import {
  Button,
  DialogClose,
  DialogContent,
  EmptyState,
  Field,
  Form,
  Input,
  PageTitle,
  Section,
  SegmentedControl,
  toast,
} from '@/design';
import { uploadFile } from '@/functions/fileUpload';
import { useMikoto } from '@/hooks';
import { useErrorElement } from '@/hooks/useErrorElement';
import { SettingSurface } from '@/views';

import { HandleSection } from '../HandleForm';
import { ConfirmDialog, SaveBar } from '../common';
import { BansSubsurface } from './Bans';
import { EmojiSubsurface } from './Emojis';
import { Invites } from './Invites';
import { RolesSubsurface } from './Roles';
import { SpaceAccentField } from './SpaceAccentField';
import styles from './index.module.css';

const ADD_BOT_FORM_ID = 'space-add-bot-form';

function AddBotModal({ space }: { space: MikotoSpace }) {
  const form = useForm<{ botId: string }>();
  const mikoto = useMikoto();
  const setModal = useSetAtom(modalState);
  const error = useErrorElement();
  const { errors, isSubmitting } = form.formState;

  return (
    <DialogContent
      size="sm"
      title={`Add a bot to ${space.name}`}
      description="Paste the bot's ID. Its owner can find it in the bot's settings."
      footer={
        <>
          <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
          <Button
            variant="primary"
            type="submit"
            form={ADD_BOT_FORM_ID}
            loading={isSubmitting}
          >
            Add bot
          </Button>
        </>
      }
    >
      <Form
        id={ADD_BOT_FORM_ID}
        onSubmit={form.handleSubmit(async (data) => {
          error.setError(null);
          try {
            await mikoto.rest['members.create'](
              { userId: data.botId.trim() },
              { params: { spaceId: space.id } },
            );
            toast({ title: 'Bot added', type: 'success' });
            setModal(null);
          } catch (e) {
            error.setError(e);
          }
        })}
      >
        {error.el}
        <Field label="Bot ID" error={errors.botId?.message}>
          <Input
            autoComplete="off"
            autoFocus
            spellCheck={false}
            placeholder="00000000-0000-0000-0000-000000000000"
            {...form.register('botId', {
              validate: (v) => v.trim().length > 0 || "Enter the bot's ID.",
            })}
          />
        </Field>
      </Form>
    </DialogContent>
  );
}

function DeleteSpaceDialog({ space }: { space: MikotoSpace }) {
  const [typed, setTyped] = useState('');
  return (
    <ConfirmDialog
      title={`Delete ${space.name}?`}
      description="This permanently deletes the space, its channels and every message in it. It can't be undone."
      confirmLabel="Delete space"
      canConfirm={typed === space.name}
      onConfirm={async () => {
        await space.delete();
        toast({ title: `${space.name} deleted`, type: 'success' });
      }}
    >
      <Field label={`Type ${space.name} to confirm`}>
        <Input
          autoComplete="off"
          autoFocus
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
        />
      </Field>
    </ConfirmDialog>
  );
}

interface OverviewValues {
  name: string;
  visibility: SpaceVisibility;
}

const OVERVIEW_FORM_ID = 'space-overview-form';

function Overview({ space }: { space: MikotoSpace }) {
  const { t } = useTranslation();
  const mikoto = useMikoto();
  const setModal = useSetAtom(modalState);
  const spaceSnap = useSnapshot(space);
  const error = useErrorElement();
  const me = mikoto.user.me;
  const isOwner = !space.ownerId || space.ownerId === me?.id;

  const form = useForm<OverviewValues>({
    defaultValues: {
      name: space.name,
      visibility: space.visibility ?? 'PRIVATE',
    },
  });
  const { isDirty, isSubmitting, errors, dirtyFields } = form.formState;
  const visibility = form.watch('visibility');

  return (
    <SettingSurface>
      <PageTitle
        title={t('spaceSettings.spaceOverview')}
        description="How your space appears to members and visitors."
      />
      {error.el}
      <form
        className={styles.contents}
        id={OVERVIEW_FORM_ID}
        onSubmit={form.handleSubmit(async (data) => {
          error.setError(null);
          try {
            const name = data.name.trim();
            await space.edit({
              ...(dirtyFields.name ? { name } : {}),
              ...(dirtyFields.visibility
                ? { visibility: data.visibility }
                : {}),
            });
            form.reset({ ...data, name });
            toast({ title: 'Space updated', type: 'success' });
          } catch (e) {
            error.setError(e);
          }
        })}
      >
        <Section title="Identity">
          <div className={styles.identity}>
            <AvatarEditor
              what="icon"
              avatar={spaceSnap.icon ?? undefined}
              onDrop={async (file) => {
                const { data } = await uploadFile('/spaceicon', file);
                await space.edit({ icon: data.url });
              }}
            />
            <div className={styles.identityFields}>
              <Field label="Space name" error={errors.name?.message}>
                <Input
                  autoComplete="off"
                  {...form.register('name', {
                    validate: (v) =>
                      v.trim().length > 0 || 'Enter a name for the space.',
                  })}
                />
              </Field>
              <SpaceAccentField space={space} />
            </div>
          </div>
        </Section>

        <Section>
          <Field
            orientation="horizontal"
            label="Visibility"
            description={
              visibility === 'PUBLIC'
                ? 'Anyone can find this space in Discover and join it.'
                : 'People need an invite to join.'
            }
          >
            <SegmentedControl
              aria-label="Visibility"
              value={visibility}
              options={[
                { value: 'PRIVATE', label: 'Private' },
                { value: 'PUBLIC', label: 'Public' },
              ]}
              onValueChange={(v) =>
                form.setValue('visibility', v, { shouldDirty: true })
              }
            />
          </Field>
        </Section>
      </form>

      <HandleSection
        current={spaceSnap.handle}
        subject="this space's"
        description='A unique name for links to this space. Use a simple name like "my-space", or verify a domain you own like "community.example.com".'
        placeholder="my-space or your-domain.com"
        setHandle={(handle) => space.edit({ handle })}
        releaseHandle={() => space.edit({ handle: null })}
        startVerification={(handle) =>
          mikoto.rest['spaces.startHandleVerification'](
            { handle },
            { params: { spaceId: space.id } },
          )
        }
        completeVerification={(handle) =>
          mikoto.rest['spaces.completeHandleVerification'](
            { handle },
            { params: { spaceId: space.id } },
          )
        }
      />

      <Section>
        <Field
          orientation="horizontal"
          label="Bots"
          description="Add a bot by its ID to let it read and post in this space."
        >
          <Button
            onClick={() => setModal({ elem: <AddBotModal space={space} /> })}
          >
            <Bot size={15} aria-hidden />
            Add bot
          </Button>
        </Field>
      </Section>

      {isOwner && (
        <Section title="Danger zone" className={styles.dangerSection}>
          <Field
            orientation="horizontal"
            label="Delete space"
            description="Permanently deletes the space for everyone."
          >
            <Button
              variant="dangerGhost"
              onClick={() =>
                setModal({ elem: <DeleteSpaceDialog space={space} /> })
              }
            >
              Delete space
            </Button>
          </Field>
        </Section>
      )}

      <SaveBar
        dirty={isDirty}
        saving={isSubmitting}
        form={OVERVIEW_FORM_ID}
        onReset={() => form.reset()}
      />
    </SettingSurface>
  );
}

function Switch({ nav, space }: { nav: string; space: MikotoSpace }) {
  switch (nav) {
    case 'overview':
      return <Overview space={space} />;
    case 'invites':
      return <Invites space={space} />;
    case 'roles':
      return <RolesSubsurface space={space} />;
    case 'emojis':
      return <EmojiSubsurface space={space} />;
    case 'bans':
      return <BansSubsurface spaceId={space.id} />;
    default:
      return null;
  }
}

const SPACE_SETTING_CATEGORIES: SettingsCategory[] = [
  { code: 'overview', tkey: 'spaceSettings.overview.title', icon: Info },
  { code: 'invites', tkey: 'spaceSettings.invites.title', icon: Mail },
  { code: 'roles', tkey: 'spaceSettings.roles.title', icon: Shield },
  { code: 'emojis', tkey: 'spaceSettings.emojis.title', icon: Smile },
  { code: 'bans', tkey: 'spaceSettings.bans.title', icon: Ban },
];

export function SpaceSettingsSurface({ spaceId }: { spaceId: string }) {
  const { t } = useTranslation();
  const mikoto = useMikoto();
  useSnapshot(mikoto.spaces);
  const space = mikoto.spaces._get(spaceId);

  if (!space) {
    return (
      <Surface>
        <EmptyState
          icon={<Users size={20} />}
          title="This space isn't available"
          description="It may have been deleted, or you may have left it. Close this tab to continue."
        />
      </Surface>
    );
  }

  return (
    <BaseSettingsSurface
      title={t('spaceSettings.settingsForSpace', { name: space.name })}
      groupLabel={space.name}
      defaultNav="overview"
      categories={SPACE_SETTING_CATEGORIES}
      switcher={(nav) => <Switch space={space} nav={nav} />}
    />
  );
}
