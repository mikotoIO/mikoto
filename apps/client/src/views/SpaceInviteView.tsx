import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Link2Off } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { normalizeMediaUrl } from '@/components/atoms/Avatar';
import { colorFromId } from '@/components/atoms/SpaceIcon';
import {
  Button,
  DelayedFallback,
  Skeleton,
  SkeletonGroup,
  describeError,
} from '@/design';
import { useMikoto } from '@/hooks';
import { useErrorElement } from '@/hooks/useErrorElement';

import styles from './SpaceInviteView.module.css';

/** Statuses that mean the invite itself is bad, not that the request failed. */
function isInvalidInvite(error: unknown) {
  if (!isAxiosError(error)) return false;
  const status = error.response?.status;
  return status === 400 || status === 404 || status === 410;
}

function InviteSkeleton() {
  return (
    <SkeletonGroup label="invite" className={styles.skeleton}>
      <Skeleton width={120} height={13} />
      <Skeleton width={88} height={88} radius={18} />
      <Skeleton width={180} height={26} />
      <Skeleton width={90} height={13} />
      <Skeleton width="100%" height={40} radius={8} />
    </SkeletonGroup>
  );
}

export function SpaceInviteView() {
  const mikoto = useMikoto();
  const navigate = useNavigate();
  const inviteCode = useParams<{ inviteCode: string }>().inviteCode ?? '';
  const [joining, setJoining] = useState(false);
  const joinError = useErrorElement();

  const preview = useQuery({
    queryKey: ['invitePreview', inviteCode],
    queryFn: () =>
      mikoto.rest['spaces.preview']({ params: { invite: inviteCode } }),
    enabled: inviteCode !== '',
    retry: (count, error) => !isInvalidInvite(error) && count < 2,
  });

  // Already a member: skip the invite and go straight to the space.
  const existing = preview.data
    ? mikoto.spaces.cache.get(preview.data.id)
    : undefined;
  useEffect(() => {
    if (!existing) return;
    navigate(
      `/space/${existing.handle ? `@${existing.handle}` : existing.id}`,
      {
        replace: true,
      },
    );
  }, [existing, navigate]);

  let body;
  if (!inviteCode || (preview.isError && isInvalidInvite(preview.error))) {
    body = (
      <>
        <div className={styles.errorIcon} aria-hidden>
          <Link2Off size={20} />
        </div>
        <h1 className={styles.name}>Invite not found</h1>
        <p className={styles.text}>
          This invite is invalid or has expired. Ask for a new link.
        </p>
        <div className={styles.actions}>
          <Button variant="primary" block onClick={() => navigate('/')}>
            Go to Mikoto
          </Button>
        </div>
      </>
    );
  } else if (preview.isError) {
    body = (
      <>
        <div className={styles.errorIcon} aria-hidden>
          <Link2Off size={20} />
        </div>
        <h1 className={styles.name}>The invite didn't load</h1>
        <p className={styles.text}>{describeError(preview.error).message}</p>
        <div className={styles.actions}>
          <Button
            variant="primary"
            block
            loading={preview.isFetching}
            onClick={() => void preview.refetch()}
          >
            Try again
          </Button>
        </div>
      </>
    );
  } else if (!preview.data || existing) {
    body = (
      <DelayedFallback>
        <InviteSkeleton />
      </DelayedFallback>
    );
  } else {
    const space = preview.data;
    const icon = normalizeMediaUrl(space.icon);
    body = (
      <>
        <p className={styles.eyebrow}>You've been invited to join</p>
        <div
          className={styles.icon}
          aria-hidden
          style={
            icon
              ? { backgroundImage: `url(${icon})` }
              : { backgroundColor: colorFromId(space.id) }
          }
        >
          {!icon && (space.name[0]?.toUpperCase() ?? '')}
        </div>
        <h1 className={styles.name}>{space.name}</h1>
        <p className={styles.members}>
          <span className={styles.dot} aria-hidden />
          {space.memberCount} {space.memberCount === 1 ? 'member' : 'members'}
        </p>
        <div className={styles.actions}>
          {joinError.el}
          <Button
            variant="primary"
            size="lg"
            block
            loading={joining}
            onClick={async () => {
              setJoining(true);
              joinError.setError(null);
              try {
                await mikoto.rest['spaces.join'](undefined, {
                  params: { invite: inviteCode },
                });
                window.location.href = `/`;
              } catch (e) {
                joinError.setError(
                  isInvalidInvite(e)
                    ? 'This invite is invalid or has expired. Ask for a new link.'
                    : e,
                );
                setJoining(false);
              }
            }}
          >
            Join {space.name}
          </Button>
          <Button variant="ghost" block onClick={() => navigate('/')}>
            Not now
          </Button>
        </div>
      </>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>{body}</div>
    </main>
  );
}
