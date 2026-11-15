import { useSetAtom } from 'jotai';
import {
  ArrowUpRight,
  Compass,
  type LucideIcon,
  Plus,
  Search,
  Sparkles,
  Users,
} from 'lucide-react';
import React, { type CSSProperties, useCallback, useState } from 'react';

import { commandMenuOpenAtom } from '@/components/CommandMenu';
import { MikotoLogo } from '@/components/icons';
import { SpaceJoinModal } from '@/components/modals/SpaceJoin';
import { Kbd, toast } from '@/design';
import { useMikoto } from '@/hooks';
import { useModalKit } from '@/store';
import { Tabable, useTabkit } from '@/store/surface';

import styles from './WelcomePanel.module.css';

const OFFICIAL_SPACE_INVITE = 'https://platform.mikoto.io/invite/WtvbKS7mrLSd';
const TAB_MIME = 'application/mikoto-tab';

const isMac =
  typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad/.test(navigator.userAgent);

function isTabable(value: unknown): value is Tabable {
  return (
    typeof value === 'object' &&
    value !== null &&
    'kind' in value &&
    'key' in value &&
    typeof value.kind === 'string' &&
    typeof value.key === 'string'
  );
}

function LauncherRow({
  icon: Icon,
  label,
  meta,
  onClick,
  href,
}: {
  icon: LucideIcon;
  label: string;
  meta?: string;
  onClick?: () => void;
  href?: string;
}) {
  const content = (
    <>
      <Icon size={16} aria-hidden />
      <span className={styles.rowLabel}>{label}</span>
      {meta && <span className={styles.rowMeta}>{meta}</span>}
    </>
  );
  if (href) {
    return (
      <a
        className={styles.row}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {content}
        <ArrowUpRight size={14} aria-label="Opens in a new tab" />
      </a>
    );
  }
  return (
    <button type="button" className={styles.row} onClick={onClick}>
      {content}
    </button>
  );
}

/**
 * The home tab, shown when no tabs are open: a quiet launcher. Tabs can be
 * dropped onto it to open them.
 *
 * `background` is reserved for user-chosen wallpapers (a CSS background
 * image value such as `url(...)`); nothing passes it yet.
 */
export function WelcomePanel({ background }: { background?: string }) {
  const tabkit = useTabkit();
  const mikoto = useMikoto();
  const setModal = useModalKit();
  const setCommandMenuOpen = useSetAtom(commandMenuOpenAtom);
  const [dragOver, setDragOver] = useState(false);

  const firstName = mikoto.user.me?.name?.split(/\s+/)[0];

  const onDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes(TAB_MIME)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOver(true);
    }
  }, []);

  const onDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const rawTab = e.dataTransfer.getData(TAB_MIME);
      if (!rawTab) return;
      let tab: unknown;
      try {
        tab = JSON.parse(rawTab);
      } catch {
        tab = null;
      }
      if (!isTabable(tab)) {
        toast({ type: 'error', title: "That tab couldn't be opened here" });
        return;
      }
      tabkit.openTab(tab, true);
    },
    [tabkit],
  );

  const style: CSSProperties | undefined = background
    ? { '--welcome-bg': background }
    : undefined;

  return (
    <div
      className={styles.root}
      style={style}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className={styles.background} aria-hidden />

      {dragOver && (
        <div className={styles.dropOverlay}>Drop to open the tab here</div>
      )}

      <div className={styles.launcher}>
        <MikotoLogo size={28} className={styles.logo} title="Mikoto" />
        <p className={styles.greeting}>
          {firstName ? `Welcome back, ${firstName}.` : 'Welcome back.'}
        </p>
        <button
          type="button"
          className={styles.box}
          onClick={() => setCommandMenuOpen(true)}
          aria-label="Jump to a space, channel or person"
          aria-keyshortcuts={isMac ? 'Meta+K' : 'Control+K'}
        >
          <Search size={18} aria-hidden />
          <span className={styles.boxText}>
            Jump to a space, channel or person
          </span>
          <Kbd>{isMac ? '⌘ K' : 'Ctrl K'}</Kbd>
        </button>

        <nav className={styles.list} aria-label="Get started">
          <p className={styles.label}>Get started</p>
          <LauncherRow
            icon={Plus}
            label="Create or join a space"
            onClick={() => setModal(<SpaceJoinModal />)}
          />
          <LauncherRow
            icon={Compass}
            label="Discover public spaces"
            onClick={() =>
              tabkit.openTab({ kind: 'discovery', key: 'discovery' }, true)
            }
          />
          <LauncherRow
            icon={Users}
            label="Friends"
            onClick={() =>
              tabkit.openTab({ kind: 'friends', key: 'friends' }, true)
            }
          />
          <LauncherRow
            icon={Sparkles}
            label="Join the Mikoto community space"
            meta="Official"
            href={OFFICIAL_SPACE_INVITE}
          />
        </nav>
      </div>
    </div>
  );
}
