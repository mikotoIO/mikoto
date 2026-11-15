import { Users } from 'lucide-react';
import { type ReactNode, useState } from 'react';

import { normalizeMediaUrl } from '@/components/atoms/Avatar';
import { Skeleton, SkeletonGroup, spaceAccent } from '@/design';

import styles from './SpaceCard.module.css';

export { styles as spaceCardStyles };

export interface SpaceCardSpace {
  id: string;
  name: string;
  icon?: string | null;
  memberCount?: number;
  description?: string | null;
}

function SpaceGlyph({ space }: { space: SpaceCardSpace }) {
  const [broken, setBroken] = useState(false);
  const accent = spaceAccent(space);
  const showImage = space.icon && !broken;
  return (
    <span
      className={styles.icon}
      data-accent={!showImage && !!accent}
      aria-hidden
    >
      {showImage ? (
        <img
          src={normalizeMediaUrl(space.icon)}
          alt=""
          onError={() => setBroken(true)}
        />
      ) : (
        (space.name.trim()[0] ?? '?').toUpperCase()
      )}
    </span>
  );
}

function formatMembers(count: number) {
  return `${count.toLocaleString()} ${count === 1 ? 'member' : 'members'}`;
}

/** A space in a grid: icon, name, member count, optional blurb, actions. */
export function SpaceCard({
  space,
  actions,
}: {
  space: SpaceCardSpace;
  actions?: ReactNode;
}) {
  const accent = spaceAccent(space);
  return (
    <article
      className={styles.card}
      style={accent ? { '--space-accent': accent } : undefined}
      aria-label={space.name}
    >
      {accent && <span className={styles.banner} aria-hidden />}
      <div className={styles.head}>
        <SpaceGlyph space={space} />
        <div className={styles.text}>
          <h3 className={styles.name} title={space.name}>
            {space.name}
          </h3>
          {typeof space.memberCount === 'number' && (
            <div className={styles.meta}>
              <Users size={13} aria-hidden />
              {formatMembers(space.memberCount)}
            </div>
          )}
        </div>
      </div>
      {space.description && (
        <p className={styles.description}>{space.description}</p>
      )}
      {actions && <div className={styles.actions}>{actions}</div>}
    </article>
  );
}

const SKELETON_CARDS = ['a', 'b', 'c', 'd', 'e', 'f'];

/** Placeholder grid with the same card shape and gaps. */
export function SpaceCardGridSkeleton({ label }: { label: string }) {
  return (
    <SkeletonGroup label={label} className={styles.grid}>
      {SKELETON_CARDS.map((id) => (
        <div key={id} className={styles.skeletonCard}>
          <div className={styles.head}>
            <Skeleton width={44} height={44} radius={11} />
            <div className={styles.text}>
              <Skeleton width="60%" height={14} />
              <Skeleton width="38%" height={11} style={{ marginTop: 7 }} />
            </div>
          </div>
          <Skeleton width="100%" height={28} radius={8} />
        </div>
      ))}
    </SkeletonGroup>
  );
}
