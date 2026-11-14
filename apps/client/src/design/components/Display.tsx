import { useAtomValue } from 'jotai';
import {
  type CSSProperties,
  type ComponentProps,
  type ElementType,
  type ReactNode,
} from 'react';

import { appearanceAtom } from '../appearance';
import { cx } from '../cx';
import styles from './Display.module.css';

/* ------------------------------------------------------------------ Badge */

/** Unread/mention counts. `mention` is the loud, accent-filled variant. */
export function Badge({
  count,
  mention,
  max = 99,
  className,
}: {
  count: number;
  mention?: boolean;
  max?: number;
  className?: string;
}) {
  if (count <= 0) return null;
  return (
    <span
      className={cx(styles.badge, mention && styles.mention, className)}
      aria-label={`${count} ${mention ? 'mention' : 'unread'}${count === 1 ? '' : 's'}`}
    >
      {count > max ? `${max}+` : count}
    </span>
  );
}

/** Unread dot, for places without room for a count. */
export function Dot({ className }: { className?: string }) {
  return <span className={cx(styles.dot, className)} aria-hidden />;
}

/* -------------------------------------------------------------------- Tag */

/**
 * Small label. Pass `color` for a role tag; it's adjusted for contrast the
 * same way role-colored names are.
 */
export function Tag({
  color,
  tone = 'neutral',
  className,
  children,
}: {
  color?: string | null;
  tone?: 'neutral' | 'accent' | 'danger' | 'ok' | 'warn';
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cx(
        styles.tag,
        color ? styles.roleTag : styles[tone],
        className,
      )}
      style={color ? { '--role': color } : undefined}
    >
      {children}
    </span>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className={styles.kbd}>{children}</kbd>;
}

/* --------------------------------------------------------------- RoleName */

/**
 * A member's display name, colored by their top role when the user has
 * "Colored names" on, or followed by a role tag when they chose "Role tags".
 * Outside a space (DMs, Home) pass no role. Colors are clamped per theme so
 * they always meet WCAG AA against the background.
 */
export function RoleName({
  name,
  roleColor,
  roleName,
  as: Tag_ = 'span',
  className,
  ...rest
}: {
  name: ReactNode;
  roleColor?: string | null;
  roleName?: string | null;
  as?: ElementType;
  className?: string;
} & Omit<ComponentProps<'span'>, 'children'>) {
  const { roleStyle } = useAtomValue(appearanceAtom);
  const colored = roleColor && roleStyle === 'color';
  return (
    <>
      <Tag_
        className={cx(colored && styles.roleColor, className)}
        style={colored ? { '--role': roleColor } : undefined}
        {...rest}
      >
        {name}
      </Tag_>
      {roleStyle === 'tag' && roleName && (
        <Tag color={roleColor}>{roleName}</Tag>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ Stack */

const SPACE = { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32 } as const;

/**
 * Flex layout without a stylesheet, for simple groupings. Anything with
 * real styling deserves its own CSS module class instead.
 */
export function Stack({
  direction = 'column',
  gap = 2,
  align,
  justify,
  wrap,
  grow,
  as: Comp = 'div',
  className,
  style,
  children,
}: {
  direction?: 'row' | 'column';
  gap?: keyof typeof SPACE;
  align?: CSSProperties['alignItems'];
  justify?: CSSProperties['justifyContent'];
  wrap?: boolean;
  grow?: boolean;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  return (
    <Comp
      className={className}
      style={{
        display: 'flex',
        flexDirection: direction,
        gap: SPACE[gap],
        alignItems: align,
        justifyContent: justify,
        flexWrap: wrap ? 'wrap' : undefined,
        flex: grow ? 1 : undefined,
        minWidth: 0,
        ...style,
      }}
    >
      {children}
    </Comp>
  );
}

/* ------------------------------------------------------------- PaneHeader */

/**
 * The 50px bar at the top of every tab: icon, title, optional topic, and
 * right-aligned actions (IconButtons).
 */
export function PaneHeader({
  icon,
  title,
  topic,
  actions,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  topic?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cx(styles.paneHeader, className)}>
      <h1 className={styles.paneTitle}>
        {icon && <span className={styles.paneIcon}>{icon}</span>}
        <span className={styles.truncate}>{title}</span>
      </h1>
      {topic && <div className={styles.paneTopic}>{topic}</div>}
      {actions && <div className={styles.paneActions}>{actions}</div>}
    </header>
  );
}

/** Heading + intro for page-like tabs (settings, discovery). */
export function PageTitle({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className={styles.pageTitle}>
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className={styles.pageActions}>{actions}</div>}
    </div>
  );
}

/**
 * A titled group of settings/fields separated by hairlines.
 * `<Section title="Theme" description="…">…</Section>`
 */
export function Section({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx(styles.section, className)}>
      {(title || actions) && (
        <div className={styles.sectionHead}>
          <div>
            {title && <h3>{title}</h3>}
            {description && <p>{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}
