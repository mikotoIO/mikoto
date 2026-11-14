import { useEffect, useState } from 'react';

import { SidebarRowsSkeleton } from '@/components/sidebars/Base';
import { DelayedFallback, Skeleton, SkeletonGroup } from '@/design';

import styles from './MainView.module.css';

const SLOW_CONNECT_MS = 6000;

/**
 * Shown while connecting: the shell's own shape (rail, sidebar, sheet), so
 * the app doesn't jump when it lands. Says so if it's taking a while.
 */
export function ShellSkeleton() {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), SLOW_CONNECT_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={styles.app}>
      <DelayedFallback>
        <SkeletonGroup label="Mikoto" className={styles.app}>
          <div className={styles.skRail}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} width={38} height={38} radius={11} />
            ))}
          </div>
          <div className={styles.skSidebar}>
            <div className={styles.skBanner} />
            <SidebarRowsSkeleton rows={7} label="sidebar" />
          </div>
          <div className={styles.skWorkspace}>
            <div className={styles.skTabs}>
              <Skeleton width={120} height={30} radius={8} />
              <Skeleton width={96} height={30} radius={8} />
            </div>
            <div className={styles.skSheet}>
              {slow && (
                <p className={styles.slowNote}>
                  Connecting is taking longer than usual. Mikoto will keep
                  trying.
                </p>
              )}
            </div>
          </div>
        </SkeletonGroup>
      </DelayedFallback>
    </div>
  );
}
