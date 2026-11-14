import type { SpaceExt } from '@mikoto-io/mikoto.js';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Check, Compass, Plus } from 'lucide-react';
import { Suspense, useState } from 'react';
import { useSnapshot } from 'valtio/react';

import { Surface } from '@/components/Surface';
import { SpaceJoinModal } from '@/components/modals/SpaceJoin';
import { TabName } from '@/components/tabs';
import {
  Button,
  DelayedFallback,
  EmptyState,
  PageTitle,
  RegionErrorBoundary,
  describeError,
  toast,
} from '@/design';
import { useMikoto } from '@/hooks';
import { useModalKit } from '@/store';

import { SpaceCard, SpaceCardGridSkeleton, spaceCardStyles } from './SpaceCard';

function JoinButton({ space }: { space: SpaceExt }) {
  const mikoto = useMikoto();
  useSnapshot(mikoto.spaces.cache);
  const [joining, setJoining] = useState(false);
  const joined = mikoto.spaces.cache.has(space.id);

  if (joined) {
    return (
      <Button size="sm" block disabled>
        <Check size={14} aria-hidden />
        Joined
      </Button>
    );
  }

  const join = async () => {
    if (!space.handle) return;
    setJoining(true);
    try {
      await mikoto.spaces.join(`@${space.handle}`);
      toast({ type: 'success', title: `Joined ${space.name}` });
    } catch (err) {
      toast({
        type: 'error',
        title: `Couldn't join ${space.name}`,
        description: describeError(err, { context: 'action' }).message,
      });
    } finally {
      setJoining(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="primary"
      block
      loading={joining}
      disabled={!space.handle}
      title={space.handle ? undefined : 'This space has no public handle yet'}
      onClick={join}
    >
      Join space
    </Button>
  );
}

function DiscoverList() {
  const mikoto = useMikoto();
  const setModal = useModalKit();
  const { data: spaces } = useSuspenseQuery({
    queryKey: ['spaces.discover'],
    queryFn: () => mikoto.spaces.discover(),
  });

  if (spaces.length === 0) {
    return (
      <EmptyState
        className={spaceCardStyles.state}
        icon={<Compass size={20} aria-hidden />}
        title="No public spaces yet"
        description="Be the first: create a space and make it public in its settings, so others can find it here."
        action={
          <Button
            variant="primary"
            onClick={() => setModal(<SpaceJoinModal />)}
          >
            <Plus size={14} aria-hidden />
            Create a space
          </Button>
        }
      />
    );
  }

  return (
    <div className={spaceCardStyles.grid}>
      {spaces.map((space) => (
        <SpaceCard
          key={space.id}
          space={space}
          actions={<JoinButton space={space} />}
        />
      ))}
    </div>
  );
}

export function DiscoverySurface() {
  return (
    <Surface padded scroll>
      <TabName name="Discover spaces" icon={Compass} />
      <div className={spaceCardStyles.page}>
        <PageTitle
          title="Discover spaces"
          description="Browse public communities and join the ones you like. You can leave a space at any time."
        />
        <RegionErrorBoundary
          what="Public spaces"
          className={spaceCardStyles.state}
        >
          <Suspense
            fallback={
              <DelayedFallback>
                <SpaceCardGridSkeleton label="public spaces" />
              </DelayedFallback>
            }
          >
            <DiscoverList />
          </Suspense>
        </RegionErrorBoundary>
      </div>
    </Surface>
  );
}
