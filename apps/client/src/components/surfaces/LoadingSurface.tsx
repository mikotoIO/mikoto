import { Surface, surfaceStyles } from '@/components/Surface';
import {
  DelayedFallback,
  Skeleton,
  SkeletonGroup,
  SkeletonText,
} from '@/design';

/**
 * Generic tab fallback. Prefer a surface-specific skeleton that mirrors the
 * real layout; this one is for surfaces that don't have one yet.
 */
export function LoadingSurface() {
  return (
    <Surface>
      <DelayedFallback>
        <SkeletonGroup label="tab">
          <div className={surfaceStyles.skeletonHeader}>
            <Skeleton width={16} height={16} radius={4} />
            <Skeleton width={140} height={13} />
          </div>
          <div className={surfaceStyles.skeletonBody}>
            <Skeleton width="45%" height={22} />
            <SkeletonText lines={3} />
            <SkeletonText lines={4} seed={2} />
          </div>
        </SkeletonGroup>
      </DelayedFallback>
    </Surface>
  );
}
