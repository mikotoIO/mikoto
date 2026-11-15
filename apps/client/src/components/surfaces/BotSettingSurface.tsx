import type {
  BotInfo,
  BotSpaceInfo,
  BotVisibility,
} from '@mikoto-io/mikoto.js';
import {
  type UseQueryResult,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useSetAtom } from 'jotai';
import { Bot, KeyRound, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSnapshot } from 'valtio/react';

import { modalState } from '@/components/ContextMenu';
import { Surface } from '@/components/Surface';
import { Avatar } from '@/components/atoms/Avatar';
import { AvatarEditor } from '@/components/molecules/AvatarEditor';
import {
  TokenDisplay,
  botsQueryKey,
} from '@/components/surfaces/settings/account/bots';
import {
  ConfirmDialog,
  CopyField,
  ListEmpty,
  RowsSkeleton,
  SaveBar,
  SettingsList,
  SettingsPageSkeleton,
  SettingsRow,
} from '@/components/surfaces/settings/common';
import { TabName } from '@/components/tabs';
import {
  Button,
  Checkbox,
  DelayedFallback,
  ErrorState,
  Field,
  Input,
  PageTitle,
  PaneHeader,
  Section,
  SegmentedControl,
  Select,
  Textarea,
  toast,
} from '@/design';
import { uploadFile } from '@/functions/fileUpload';
import { useAuthClient, useMikoto } from '@/hooks';
import { toAppError, useErrorElement } from '@/hooks/useErrorElement';
import { useTabkit } from '@/store/surface';
import { SettingSurface } from '@/views';

import styles from './BotSettingSurface.module.css';

const botKey = (botId: string) => ['bot', botId];

function DeleteBotDialog({
  bot,
  onDeleted,
}: {
  bot: BotInfo;
  onDeleted: () => void;
}) {
  const authClient = useAuthClient();
  const [typed, setTyped] = useState('');

  return (
    <ConfirmDialog
      title={`Delete ${bot.name}?`}
      description="The bot leaves every space and its token stops working. This can't be undone."
      confirmLabel="Delete bot"
      canConfirm={typed === bot.name}
      onConfirm={async () => {
        await authClient.deleteBot(bot.id);
        toast({ title: `${bot.name} deleted`, type: 'success' });
        onDeleted();
      }}
    >
      <Field label={`Type ${bot.name} to confirm`}>
        <Input
          autoComplete="off"
          autoFocus
          placeholder={bot.name}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
        />
      </Field>
    </ConfirmDialog>
  );
}

const PERMISSION_SCOPES = [
  { key: 'read_messages', label: 'Read messages' },
  { key: 'send_messages', label: 'Send messages' },
  { key: 'manage_channels', label: 'Manage channels' },
  { key: 'manage_members', label: 'Manage members' },
  { key: 'voice', label: 'Join voice channels' },
];

interface BotValues {
  name: string;
  description: string;
  visibility: BotVisibility;
  permissions: string[];
}

const BOT_FORM_ID = 'bot-settings-form';

function botDefaults(bot: BotInfo): BotValues {
  return {
    name: bot.user?.name ?? bot.name,
    description: bot.user?.description ?? '',
    visibility: bot.visibility,
    permissions: [...(bot.permissions ?? [])],
  };
}

/** Name, description, visibility and scopes: one form, one save bar. */
function BotForm({ bot, onUpdate }: { bot: BotInfo; onUpdate: () => void }) {
  const authClient = useAuthClient();
  const error = useErrorElement();
  const form = useForm<BotValues>({ defaultValues: botDefaults(bot) });
  const { isDirty, isSubmitting, errors } = form.formState;
  const visibility = form.watch('visibility');
  const perms = form.watch('permissions');

  const togglePerm = (key: string, on: boolean) => {
    const next = on ? [...perms, key] : perms.filter((p) => p !== key);
    form.setValue('permissions', next, { shouldDirty: true });
  };

  return (
    <>
      {error.el}
      <form
        id={BOT_FORM_ID}
        className={styles.contents}
        onSubmit={form.handleSubmit(async (data) => {
          error.setError(null);
          try {
            const values = { ...data, name: data.name.trim() };
            await authClient.updateBot(bot.id, values);
            form.reset(values);
            toast({ title: 'Bot saved', type: 'success' });
            onUpdate();
          } catch (e) {
            error.setError(e);
          }
        })}
      >
        <Section title="Profile">
          <div className={styles.identity}>
            <AvatarEditor
              avatar={bot.user?.avatar ?? undefined}
              onDrop={async (file) => {
                const { data } = await uploadFile('/avatar', file);
                await authClient.updateBot(bot.id, { avatar: data.url });
                onUpdate();
              }}
            />
            <div className={styles.identityFields}>
              <Field label="Bot name" error={errors.name?.message}>
                <Input
                  autoComplete="off"
                  {...form.register('name', {
                    validate: (v) =>
                      v.trim().length > 0 || 'Give your bot a name.',
                  })}
                />
              </Field>
              <Field label="Description">
                <Textarea
                  className={styles.description}
                  placeholder="What does this bot do?"
                  {...form.register('description')}
                />
              </Field>
              <Field label="Bot ID">
                <CopyField value={bot.id} what="Bot ID" />
              </Field>
            </div>
          </div>
        </Section>

        <Section title="Permissions and visibility">
          <Field
            orientation="horizontal"
            label="Visibility"
            description={
              visibility === 'PUBLIC'
                ? 'Anyone can find and add this bot by its handle.'
                : 'Only you can add this bot to spaces.'
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
          <Field
            label="Permission scopes"
            description="What the bot is allowed to do in spaces it's added to."
          >
            <div className={styles.scopes}>
              {PERMISSION_SCOPES.map((scope) => (
                <Checkbox
                  key={scope.key}
                  label={scope.label}
                  checked={perms.includes(scope.key)}
                  onCheckedChange={(on) => togglePerm(scope.key, on)}
                />
              ))}
            </div>
          </Field>
        </Section>
      </form>
      <SaveBar
        dirty={isDirty}
        saving={isSubmitting}
        form={BOT_FORM_ID}
        onReset={() => form.reset()}
      />
    </>
  );
}

function AuthSection({ bot }: { bot: BotInfo }) {
  const authClient = useAuthClient();
  const setModal = useSetAtom(modalState);
  const [newToken, setNewToken] = useState<string | null>(null);

  const regenerated = bot.lastTokenRegeneratedAt
    ? new Date(bot.lastTokenRegeneratedAt)
    : null;
  const tokenStatus =
    regenerated && !Number.isNaN(regenerated.getTime())
      ? `Last regenerated ${regenerated.toLocaleDateString()}.`
      : 'The token has never been regenerated.';

  return (
    <Section title="Authentication">
      {newToken ? (
        <TokenDisplay token={newToken} />
      ) : (
        <Field orientation="horizontal" label="Token" description={tokenStatus}>
          <Button
            onClick={() =>
              setModal({
                elem: (
                  <ConfirmDialog
                    title="Regenerate the token?"
                    description="The current token stops working right away. Anything using it will be signed out until you update it."
                    confirmLabel="Regenerate token"
                    onConfirm={async () => {
                      const res = await authClient.regenerateBotToken(bot.id);
                      setNewToken(res.token);
                    }}
                  />
                ),
              })
            }
          >
            <KeyRound size={15} aria-hidden />
            Regenerate token
          </Button>
        </Field>
      )}
      {bot.visibility === 'PUBLIC' && bot.user?.handle && (
        <Field
          label="Bot handle"
          description="Public bots can be found and added by their handle."
        >
          <CopyField value={bot.user.handle} what="Handle" />
        </Field>
      )}
    </Section>
  );
}

function SpacesSection({ bot }: { bot: BotInfo }) {
  const authClient = useAuthClient();
  const mikoto = useMikoto();
  const queryClient = useQueryClient();
  useSnapshot(mikoto.spaces);
  const key = ['bot', bot.id, 'spaces'];

  const spaces = useQuery({
    queryKey: key,
    queryFn: () => authClient.listBotSpaces(bot.id),
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: key });

  const [selectedSpaceId, setSelectedSpaceId] = useState('');
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const installed = new Set(spaces.data?.map((s) => s.spaceId) ?? []);
  const availableSpaces = Array.from(mikoto.spaces.cache.values()).filter(
    (s) => s.type === 'NONE' && !installed.has(s.id),
  );

  const remove = async (s: BotSpaceInfo) => {
    setRemoving(s.spaceId);
    try {
      await authClient.removeBotFromSpace(bot.id, s.spaceId);
      toast({ title: `Removed from ${s.spaceName}`, type: 'success' });
      await refresh();
    } catch (e) {
      toast({
        title: `Couldn't remove the bot from ${s.spaceName}`,
        description: toAppError(e)?.message,
        type: 'error',
      });
    } finally {
      setRemoving(null);
    }
  };

  const add = async () => {
    const space = mikoto.spaces.cache.get(selectedSpaceId);
    setAdding(true);
    try {
      await authClient.installBot(bot.id, { spaceId: selectedSpaceId });
      toast({
        title: `Added to ${space?.name ?? 'the space'}`,
        type: 'success',
      });
      setSelectedSpaceId('');
      await refresh();
    } catch (e) {
      toast({
        title: "Couldn't add the bot",
        description: toAppError(e)?.message,
        type: 'error',
      });
    } finally {
      setAdding(false);
    }
  };

  return (
    <Section
      title="Spaces"
      description="Spaces this bot is in. You can add it to spaces you manage."
    >
      {spaces.isPending ? (
        <DelayedFallback>
          <RowsSkeleton label="spaces" rows={2} leading={32} />
        </DelayedFallback>
      ) : spaces.isError && !spaces.data ? (
        <ErrorState
          variant="region"
          what="Spaces"
          error={spaces.error}
          onRetry={() => void spaces.refetch()}
        />
      ) : spaces.data.length === 0 ? (
        <ListEmpty
          title="Not in any spaces yet"
          description="Pick a space below to add the bot to it."
        />
      ) : (
        <SettingsList>
          {spaces.data.map((s) => (
            <SettingsRow
              key={s.spaceId}
              leading={<Avatar src={s.spaceIcon ?? undefined} size={32} />}
              title={s.spaceName}
              actions={
                <Button
                  size="sm"
                  variant="dangerGhost"
                  loading={removing === s.spaceId}
                  onClick={() => remove(s)}
                >
                  <Trash2 size={14} aria-hidden />
                  Remove
                </Button>
              }
            />
          ))}
        </SettingsList>
      )}
      {availableSpaces.length > 0 && (
        <div className={styles.addSpace}>
          <Select
            aria-label="Space to add the bot to"
            value={selectedSpaceId}
            onChange={(e) => setSelectedSpaceId(e.target.value)}
          >
            <option value="">Choose a space…</option>
            {availableSpaces.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
          <Button
            variant="primary"
            disabled={!selectedSpaceId}
            loading={adding}
            onClick={add}
          >
            <Plus size={15} aria-hidden />
            Add to space
          </Button>
        </div>
      )}
    </Section>
  );
}

function BotSettings({
  botId,
  bot,
}: {
  botId: string;
  bot: UseQueryResult<BotInfo>;
}) {
  const tabkit = useTabkit();
  const queryClient = useQueryClient();
  const setModal = useSetAtom(modalState);

  const refresh = () => {
    void bot.refetch();
    void queryClient.invalidateQueries({ queryKey: botsQueryKey });
  };

  if (bot.isPending) {
    return (
      <SettingSurface>
        <DelayedFallback>
          <SettingsPageSkeleton label="bot settings" />
        </DelayedFallback>
      </SettingSurface>
    );
  }
  if (bot.isError && !bot.data) {
    return (
      <ErrorState
        what="This bot"
        error={bot.error}
        onRetry={() => void bot.refetch()}
      />
    );
  }

  const data = bot.data;
  return (
    <SettingSurface>
      <PageTitle
        title={data.name}
        description="Manage how your bot looks, what it can do and where it's installed."
      />
      <BotForm key={data.id} bot={data} onUpdate={refresh} />
      <AuthSection bot={data} />
      <SpacesSection bot={data} />
      <Section title="Danger zone" className={styles.lastSection}>
        <Field
          orientation="horizontal"
          label="Delete bot"
          description="Removes the bot from every space and revokes its token."
        >
          <Button
            variant="dangerGhost"
            onClick={() =>
              setModal({
                elem: (
                  <DeleteBotDialog
                    bot={data}
                    onDeleted={() => {
                      void queryClient.invalidateQueries({
                        queryKey: botsQueryKey,
                      });
                      tabkit.removeTab(botId);
                    }}
                  />
                ),
              })
            }
          >
            <Trash2 size={14} aria-hidden />
            Delete bot
          </Button>
        </Field>
      </Section>
    </SettingSurface>
  );
}

export function BotSettingSurface({ botId }: { botId: string }) {
  const authClient = useAuthClient();
  const bot = useQuery({
    queryKey: botKey(botId),
    queryFn: () => authClient.getBot(botId),
  });
  const title = bot.data?.name ?? 'Bot settings';
  return (
    <Surface>
      <TabName icon={Bot} name={title} />
      <PaneHeader icon={<Bot size={16} aria-hidden />} title={title} />
      <BotSettings botId={botId} bot={bot} />
    </Surface>
  );
}
