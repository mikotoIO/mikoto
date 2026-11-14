import { useSetAtom } from 'jotai';
import { ArrowRight, Compass, Earth, Plus } from 'lucide-react';
import { useSnapshot } from 'valtio/react';

import { SpaceJoinModal } from '@/components/modals/SpaceJoin';
import { Button, EmptyState, PageTitle } from '@/design';
import { useMikoto } from '@/hooks';
import { treebarSpaceState, useModalKit } from '@/store';
import { useTabkit } from '@/store/surface';

import { Surface } from '../Surface';
import { TabName } from '../tabs';
import { SpaceCard, spaceCardStyles } from './SpaceCard';

export function SpaceExplorerSurface() {
  const mikoto = useMikoto();
  useSnapshot(mikoto.spaces.cache);
  const setLeftSidebar = useSetAtom(treebarSpaceState);
  const setModal = useModalKit();
  const tabkit = useTabkit();

  // Only community spaces; DMs and other internal space types are hidden.
  const spaces = Array.from(mikoto.spaces.cache.values())
    .filter((space) => space.type === 'NONE')
    .sort((a, b) => a.name.localeCompare(b.name));

  const openSpace = (spaceId: string) =>
    setLeftSidebar({ kind: 'explorer', key: `explorer/${spaceId}`, spaceId });

  const discover = () =>
    tabkit.openTab({ kind: 'discovery', key: 'discovery' }, true);

  const create = () => setModal(<SpaceJoinModal />);

  return (
    <Surface padded scroll>
      <TabName name="My spaces" icon={Earth} />
      <div className={spaceCardStyles.page}>
        <PageTitle
          title="My spaces"
          description="Every space you're a member of."
          actions={
            <>
              <Button onClick={discover}>
                <Compass size={14} aria-hidden />
                Discover spaces
              </Button>
              <Button variant="primary" onClick={create}>
                <Plus size={14} aria-hidden />
                Create or join
              </Button>
            </>
          }
        />
        {spaces.length === 0 ? (
          <EmptyState
            className={spaceCardStyles.state}
            icon={<Earth size={20} aria-hidden />}
            title="You're not in any spaces yet"
            description="Join a public space from Discover, paste an invite link, or start your own."
            action={
              <Button variant="primary" onClick={discover}>
                <Compass size={14} aria-hidden />
                Discover spaces
              </Button>
            }
          />
        ) : (
          <div className={spaceCardStyles.grid}>
            {spaces.map((space) => (
              <SpaceCard
                key={space.id}
                space={space}
                actions={
                  <Button size="sm" block onClick={() => openSpace(space.id)}>
                    Open
                    <ArrowRight size={14} aria-hidden />
                  </Button>
                }
              />
            ))}
          </div>
        )}
      </div>
    </Surface>
  );
}
