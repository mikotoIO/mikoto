import type { BotCreatedResponse } from '@mikoto-io/mikoto.js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSetAtom } from 'jotai';
import { Bot, Eye, EyeOff, Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { modalState } from '@/components/ContextMenu';
import { Avatar } from '@/components/atoms/Avatar';
import {
  Button,
  DelayedFallback,
  DialogClose,
  DialogContent,
  ErrorState,
  Field,
  Form,
  IconButton,
  Input,
  PageTitle,
  Tag,
} from '@/design';
import { useAuthClient } from '@/hooks';
import { useErrorElement } from '@/hooks/useErrorElement';
import { useTabkit } from '@/store/surface';
import { SettingSurface } from '@/views';

import {
  CopyField,
  ListEmpty,
  RowsSkeleton,
  SettingsList,
  SettingsRow,
  WarningNote,
  settingsStyles,
} from '../common';

export const botsQueryKey = ['account', 'bots'] as const;

/** A secret shown once, masked until revealed. */
export function TokenDisplay({ token }: { token: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={settingsStyles.methods}>
      <WarningNote>
        This token is shown only once. Copy it now and store it somewhere safe;
        anyone with it can act as your bot.
      </WarningNote>
      <CopyField
        value={token}
        what="Token"
        display={visible ? token : '•'.repeat(32)}
        extra={
          <IconButton
            aria-label={visible ? 'Hide token' : 'Show token'}
            onClick={() => setVisible(!visible)}
          >
            {visible ? <EyeOff size={15} /> : <Eye size={15} />}
          </IconButton>
        }
      />
    </div>
  );
}

const CREATE_BOT_FORM_ID = 'create-bot-form';

function BotCreateModal() {
  const authClient = useAuthClient();
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState } = useForm<{ name: string }>();
  const setModal = useSetAtom(modalState);
  const [created, setCreated] = useState<BotCreatedResponse | null>(null);
  const error = useErrorElement();

  if (created) {
    return (
      <DialogContent
        title={`${created.name} is ready`}
        description="Use the bot ID and token to sign in from your code."
        footer={
          <Button variant="primary" onClick={() => setModal(null)}>
            Done
          </Button>
        }
      >
        <div className={settingsStyles.methods}>
          <Field label="Bot ID">
            <CopyField value={created.id} what="Bot ID" />
          </Field>
          <Field label="Token">
            <TokenDisplay token={created.token} />
          </Field>
        </div>
      </DialogContent>
    );
  }

  return (
    <DialogContent
      title="Create a bot"
      description="Bots can join your spaces and act through the Mikoto API."
      footer={
        <>
          <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
          <Button
            variant="primary"
            type="submit"
            form={CREATE_BOT_FORM_ID}
            loading={formState.isSubmitting}
          >
            Create bot
          </Button>
        </>
      }
    >
      <Form
        id={CREATE_BOT_FORM_ID}
        onSubmit={handleSubmit(async (form) => {
          error.setError(null);
          try {
            const res = await authClient.createBot({ name: form.name.trim() });
            setCreated(res);
            void queryClient.invalidateQueries({ queryKey: botsQueryKey });
          } catch (e) {
            error.setError(e);
          }
        })}
      >
        {error.el}
        <Field label="Bot name" error={formState.errors.name?.message}>
          <Input
            autoComplete="off"
            autoFocus
            placeholder="Release notes bot"
            {...register('name', {
              validate: (v) => v.trim().length > 0 || 'Give your bot a name.',
            })}
          />
        </Field>
      </Form>
    </DialogContent>
  );
}

export function BotsSurface() {
  const authClient = useAuthClient();
  const setModal = useSetAtom(modalState);
  const tabkit = useTabkit();
  const { t } = useTranslation();

  const bots = useQuery({
    queryKey: botsQueryKey,
    queryFn: () => authClient.listBots(),
  });

  const openCreate = () => setModal({ elem: <BotCreateModal /> });

  return (
    <SettingSurface>
      <PageTitle
        title={t('accountSettings.bots.title')}
        description="Create and manage bots that work in your spaces through the Mikoto API."
        actions={
          bots.data && bots.data.length > 0 ? (
            <Button variant="primary" onClick={openCreate}>
              <Plus size={15} aria-hidden />
              {t('accountSettings.bots.createBot')}
            </Button>
          ) : undefined
        }
      />

      {bots.isPending ? (
        <DelayedFallback>
          <RowsSkeleton label="bots" action={false} />
        </DelayedFallback>
      ) : bots.isError && !bots.data ? (
        <ErrorState
          variant="region"
          what="Your bots"
          error={bots.error}
          onRetry={() => void bots.refetch()}
        />
      ) : bots.data.length === 0 ? (
        <ListEmpty
          icon={<Bot size={18} />}
          title="No bots yet"
          description="Create a bot to post updates, run commands or connect another service to your spaces."
          action={
            <Button variant="primary" onClick={openCreate}>
              <Plus size={15} aria-hidden />
              {t('accountSettings.bots.createBot')}
            </Button>
          }
        />
      ) : (
        <SettingsList>
          {bots.data.map((bot) => (
            <SettingsRow
              key={bot.id}
              leading={<Avatar src={bot.user?.avatar ?? undefined} size={40} />}
              title={
                <>
                  {bot.name}
                  <Tag tone={bot.visibility === 'PUBLIC' ? 'ok' : 'neutral'}>
                    {bot.visibility === 'PUBLIC' ? 'Public' : 'Private'}
                  </Tag>
                </>
              }
              meta={<span className={settingsStyles.mono}>{bot.id}</span>}
              onClick={() =>
                tabkit.openTab(
                  { kind: 'botSettings', botId: bot.id, key: bot.id },
                  true,
                )
              }
            />
          ))}
        </SettingsList>
      )}
    </SettingSurface>
  );
}
