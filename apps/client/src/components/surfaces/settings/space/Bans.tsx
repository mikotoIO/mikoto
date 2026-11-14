import { type BanInfo } from '@mikoto-io/mikoto.js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Avatar } from '@/components/atoms/Avatar';
import {
  Button,
  DelayedFallback,
  ErrorState,
  PageTitle,
  toast,
} from '@/design';
import { useMikoto } from '@/hooks';
import { toAppError } from '@/hooks/useErrorElement';
import { SettingSurface } from '@/views';

import { ListEmpty, RowsSkeleton, SettingsList, SettingsRow } from '../common';

function UnbanButton({ ban, spaceId }: { ban: BanInfo; spaceId: string }) {
  const mikoto = useMikoto();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const name = ban.user?.name ?? 'this user';

  // Unbanning is reversible (ban again from the member list), so no confirm.
  return (
    <Button
      size="sm"
      variant="dangerGhost"
      loading={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await mikoto.rest['bans.delete'](undefined, {
            params: { spaceId, userId: ban.userId },
          });
          queryClient.setQueryData<BanInfo[]>(['bans', spaceId], (prev) =>
            prev?.filter((x) => x.id !== ban.id),
          );
          toast({ title: `Unbanned ${name}`, type: 'success' });
        } catch (e) {
          toast({
            title: `Couldn't unban ${name}`,
            description: toAppError(e)?.message,
            type: 'error',
          });
        } finally {
          setBusy(false);
        }
      }}
    >
      Unban
    </Button>
  );
}

export const BansSubsurface = ({ spaceId }: { spaceId: string }) => {
  const { t } = useTranslation();
  const mikoto = useMikoto();
  const bans = useQuery({
    queryKey: ['bans', spaceId],
    queryFn: () => mikoto.rest['bans.list']({ params: { spaceId } }),
  });

  return (
    <SettingSurface>
      <PageTitle
        title={t('spaceSettings.bans.title')}
        description="Banned people can't rejoin this space, even with an invite."
      />
      {bans.isPending ? (
        <DelayedFallback>
          <RowsSkeleton label="bans" />
        </DelayedFallback>
      ) : bans.isError && !bans.data ? (
        <ErrorState
          variant="region"
          what="Bans"
          error={bans.error}
          onRetry={() => void bans.refetch()}
        />
      ) : bans.data.length === 0 ? (
        <ListEmpty
          icon={<Ban size={18} />}
          title="No one is banned"
          description="To ban someone, right-click their name in the member list."
        />
      ) : (
        <SettingsList>
          {bans.data.map((ban) => (
            <SettingsRow
              key={ban.id}
              leading={
                <Avatar
                  size={40}
                  src={ban.user?.avatar ?? undefined}
                  userId={ban.userId}
                />
              }
              title={ban.user?.name ?? 'Deleted user'}
              meta={ban.reason ? `Reason: ${ban.reason}` : 'No reason given'}
              actions={<UnbanButton ban={ban} spaceId={spaceId} />}
            />
          ))}
        </SettingsList>
      )}
    </SettingSurface>
  );
};
