import { useSetAtom } from 'jotai';
import { ChevronDown, PanelLeftClose, Search } from 'lucide-react';
import { NumberSize, Resizable } from 're-resizable';
import { type ComponentProps, type ElementType, type ReactNode } from 'react';

import { commandMenuOpenAtom } from '@/components/CommandMenu';
import { Badge, Dot, IconButton, Skeleton, SkeletonGroup, cx } from '@/design';
import { workspaceState } from '@/store';

import styles from './Sidebar.module.css';

export { styles as sidebarStyles };

interface SidebarProps {
  position: 'left' | 'right';
  size: number;
  children: React.ReactNode;
  onResize?: (size: NumberSize) => void;
  className?: string;
}

export const RESIZABLE_DISABLES = {
  top: false,
  right: false,
  bottom: false,
  left: false,
  topRight: false,
  bottomRight: false,
  bottomLeft: false,
  topLeft: false,
};

/** A resizable sidebar column on the base. */
export function Sidebar({
  children,
  position,
  size,
  onResize,
  className,
}: SidebarProps) {
  return (
    <Resizable
      enable={{
        ...RESIZABLE_DISABLES,
        right: position === 'left',
        left: position === 'right',
      }}
      minWidth={200}
      maxWidth="50vw"
      maxHeight="100%"
      size={{ width: size, height: '100%' }}
      onResizeStop={(_, _1, _2, d) => {
        onResize?.(d);
      }}
      className={styles.resizable}
    >
      <aside className={cx(styles.sidebar, className)}>{children}</aside>
    </Resizable>
  );
}

/* ------------------------------------------------------------------ head */

/** Search + collapse buttons shared by every sidebar header. */
export function SidebarHeadActions({
  searchLabel = 'Search',
  className,
}: {
  searchLabel?: string;
  className?: string;
}) {
  const setCommandMenuOpen = useSetAtom(commandMenuOpenAtom);
  const setWorkspace = useSetAtom(workspaceState);
  return (
    <span className={cx(styles.headActions, className)}>
      <IconButton
        aria-label={searchLabel}
        onClick={() => setCommandMenuOpen(true)}
      >
        <Search size={16} aria-hidden />
      </IconButton>
      <IconButton
        aria-label="Hide sidebar"
        onClick={() => setWorkspace((ws) => ({ ...ws, leftOpen: false }))}
      >
        <PanelLeftClose size={16} aria-hidden />
      </IconButton>
    </span>
  );
}

/** Plain sidebar header (Home). Spaces use the banner in Explorer. */
export function SidebarHead({
  title,
  actions,
}: {
  title: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className={styles.head}>
      <h2 className={styles.headTitle}>{title}</h2>
      {actions}
    </div>
  );
}

/* ------------------------------------------------------------------ rows */

export interface SidebarRowProps extends ComponentProps<'button'> {
  icon?: ReactNode;
  label: ReactNode;
  active?: boolean;
  unread?: boolean;
  /** Unread count, when known. Without one an unread row shows a dot. */
  unreadCount?: number;
  mentionCount?: number;
  /** Right-aligned meta (time, kind). Hidden when a badge shows. */
  meta?: ReactNode;
  as?: ElementType;
}

/**
 * A quiet navigation row: icon, label, and an unread badge or dot.
 * Unread rows are full-strength text at weight 600; the active row is filled.
 */
export function SidebarRow({
  icon,
  label,
  active,
  unread,
  unreadCount,
  mentionCount,
  meta,
  className,
  type = 'button',
  ...rest
}: SidebarRowProps) {
  const isUnread = Boolean(unread || unreadCount || mentionCount);
  let trailing: ReactNode = meta ? (
    <span className={styles.rowMeta}>{meta}</span>
  ) : null;
  if (mentionCount) trailing = <Badge count={mentionCount} mention />;
  else if (unreadCount) trailing = <Badge count={unreadCount} />;
  else if (unread && !active) trailing = <Dot />;

  return (
    <button
      type={type}
      className={cx(
        styles.row,
        active && styles.active,
        isUnread && styles.unread,
        className,
      )}
      aria-current={active ? 'page' : undefined}
      {...rest}
    >
      {icon && <span className={styles.rowIcon}>{icon}</span>}
      <span className={styles.rowLabel}>{label}</span>
      {trailing}
    </button>
  );
}

/* -------------------------------------------------------------- category */

/**
 * A category label. Collapsible when `onToggle` is given; `action` (an
 * IconButton) is revealed on hover.
 */
export function SidebarLabel({
  children,
  collapsed,
  onToggle,
  action,
  className,
  ...rest
}: {
  children: ReactNode;
  collapsed?: boolean;
  onToggle?: () => void;
  action?: ReactNode;
  className?: string;
} & Omit<ComponentProps<'div'>, 'children'>) {
  return (
    <div
      className={cx(styles.label, collapsed && styles.collapsed, className)}
      {...rest}
    >
      {onToggle ? (
        <button
          type="button"
          className={styles.labelButton}
          aria-expanded={!collapsed}
          onClick={onToggle}
        >
          {children}
          <ChevronDown size={13} className={styles.chevron} aria-hidden />
        </button>
      ) : (
        <span className={styles.labelButton}>{children}</span>
      )}
      {action && <span className={styles.labelAction}>{action}</span>}
    </div>
  );
}

/* -------------------------------------------------------------- skeleton */

const ROW_WIDTHS = ['62%', '48%', '71%', '55%', '66%', '40%', '58%'];

/** Rows shaped like SidebarRow, for a loading sidebar. */
export function SidebarRowsSkeleton({
  rows = 6,
  label = 'channels',
}: {
  rows?: number;
  label?: string;
}) {
  return (
    <SkeletonGroup label={label}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={styles.skRow}>
          <Skeleton width={16} height={16} radius={4} />
          <Skeleton width={ROW_WIDTHS[i % ROW_WIDTHS.length]} height={11} />
        </div>
      ))}
    </SkeletonGroup>
  );
}
