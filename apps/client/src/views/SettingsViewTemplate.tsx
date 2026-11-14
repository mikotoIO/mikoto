import { type ComponentProps, type ReactNode } from 'react';

import { cx } from '@/design';

import styles from './SettingsViewTemplate.module.css';

/**
 * The scrolling body of one settings page. Content is capped at 640px
 * (`wide` for list + editor layouts such as Roles). A <SaveBar> placed last
 * inside sticks to the bottom of this scroller.
 */
function SettingsBody({
  wide,
  className,
  children,
  ...props
}: ComponentProps<'div'> & { wide?: boolean }) {
  return (
    <div className={styles.body} {...props}>
      <div className={cx(styles.content, wide && styles.wide, className)}>
        {children}
      </div>
    </div>
  );
}

function Container({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cx(styles.container, className)} {...props} />;
}

function Sidebar({
  className,
  label = 'Settings sections',
  ...props
}: ComponentProps<'nav'> & { label?: string }) {
  return (
    <nav
      aria-label={label}
      className={cx(styles.sidebar, className)}
      {...props}
    />
  );
}

function NavLabel({ children }: { children: ReactNode }) {
  return <div className={styles.navLabel}>{children}</div>;
}

function Nav({
  active,
  icon,
  children,
  className,
  ...props
}: Omit<ComponentProps<'button'>, 'type'> & {
  active?: boolean;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-current={active ? 'page' : undefined}
      className={cx(styles.nav, className)}
      {...props}
    >
      {icon && (
        <span className={styles.navIcon} aria-hidden>
          {icon}
        </span>
      )}
      <span className={styles.navText}>{children}</span>
    </button>
  );
}

/** Right column: the compact picker (narrow panes) above the page body. */
function Main({
  compactNav,
  children,
}: {
  compactNav?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={styles.main}>
      {compactNav && <div className={styles.compactNav}>{compactNav}</div>}
      {children}
    </div>
  );
}

export const SettingSurface = Object.assign(SettingsBody, {
  Container,
  Sidebar,
  NavLabel,
  Nav,
  Main,
});
