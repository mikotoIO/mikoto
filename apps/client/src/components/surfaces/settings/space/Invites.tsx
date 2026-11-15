import { Invite, MikotoSpace } from '@mikoto-io/mikoto.js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSetAtom } from 'jotai';
import { Link2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { modalState } from '@/components/ContextMenu';
import {
  Button,
  DelayedFallback,
  ErrorState,
  PageTitle,
  toast,
} from '@/design';
import { env } from '@/env';
import { useMikoto } from '@/hooks';
import { toAppError } from '@/hooks/useErrorElement';
import { SettingSurface } from '@/views';

import {
  ConfirmDialog,
  CopyField,
  ListEmpty,
  RowsSkeleton,
  SettingsList,
  SettingsRow,
  settingsStyles,
} from '../common';

export const inviteLink = (invite: Invite) =>
  `${env.PUBLIC_FRONTEND_URL}/invite/${invite.id}`;

const invitesKey = (spaceId: string) => ['invites', spaceId];

function formatDate(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
}

export function Invites({ space }: { space: MikotoSpace }) {
  const { t } = useTranslation();
  const mikoto = useMikoto();
  const queryClient = useQueryClient();
  const setModal = useSetAtom(modalState);
  const [creating, setCreating] = useState(false);

  const invites = useQuery({
    queryKey: invitesKey(space.id),
    queryFn: () =>
      mikoto.rest['invites.list']({ params: { spaceId: space.id } }),
  });

  const createInvite = async () => {
    setCreating(true);
    try {
      const invite = await mikoto.rest['invites.create'](
        {},
        { params: { spaceId: space.id } },
      );
      queryClient.setQueryData<Invite[]>(invitesKey(space.id), (prev) => [
        invite,
        ...(prev ?? []),
      ]);
      toast({ title: 'Invite created', type: 'success' });
    } catch (e) {
      toast({
        title: "Couldn't create an invite",
        description: toAppError(e)?.message,
        type: 'error',
      });
    } finally {
      setCreating(false);
    }
  };

  const confirmDelete = (invite: Invite) =>
    setModal({
      elem: (
        <ConfirmDialog
          title="Delete this invite?"
          description="Anyone who has this link won't be able to use it to join. People who already joined stay in the space."
          confirmLabel="Delete invite"
          onConfirm={async () => {
            await mikoto.rest['invites.delete'](undefined, {
              params: { spaceId: space.id, inviteId: invite.id },
            });
            queryClient.setQueryData<Invite[]>(invitesKey(space.id), (prev) =>
              prev?.filter((x) => x.id !== invite.id),
            );
            toast({ title: 'Invite deleted', type: 'success' });
          }}
        />
      ),
    });

  const createButton = (
    <Button variant="primary" loading={creating} onClick={createInvite}>
      <Plus size={15} aria-hidden />
      Create invite
    </Button>
  );

  return (
    <SettingSurface>
      <PageTitle
        title={t('spaceSettings.invites.title')}
        description={`Anyone with an invite link can join ${space.name}.`}
        actions={
          invites.data && invites.data.length > 0 ? createButton : undefined
        }
      />
      {invites.isPending ? (
        <DelayedFallback>
          <RowsSkeleton label="invites" leading={0} />
        </DelayedFallback>
      ) : invites.isError && !invites.data ? (
        <ErrorState
          variant="region"
          what="Invites"
          error={invites.error}
          onRetry={() => void invites.refetch()}
        />
      ) : invites.data.length === 0 ? (
        <ListEmpty
          icon={<Link2 size={18} />}
          title="No invites yet"
          description="Create an invite link and share it with the people you want here."
          action={createButton}
        />
      ) : (
        <SettingsList>
          {invites.data.map((invite) => {
            const created = formatDate(invite.createdAt);
            return (
              <SettingsRow
                key={invite.id}
                title={
                  <CopyField
                    className={settingsStyles.grow}
                    value={inviteLink(invite)}
                    what="Invite link"
                  />
                }
                meta={created ? `Created ${created}` : undefined}
                actions={
                  <Button
                    size="sm"
                    variant="dangerGhost"
                    onClick={() => confirmDelete(invite)}
                  >
                    <Trash2 size={14} aria-hidden />
                    Delete
                  </Button>
                }
              />
            );
          })}
        </SettingsList>
      )}
    </SettingSurface>
  );
}
