import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { Menu as BaseMenu } from '@base-ui/react/menu';
import { Popover as BasePopover } from '@base-ui/react/popover';
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import { X } from 'lucide-react';
import { type ComponentProps, type ReactElement, type ReactNode } from 'react';

import { cx } from '../cx';
import styles from './Overlay.module.css';

type Side = 'top' | 'bottom' | 'left' | 'right';
type Align = 'start' | 'center' | 'end';

/* ------------------------------------------------------------------ Dialog */

/** Dialog root. Controlled: `<Dialog open={...} onOpenChange={setOpen}>`. */
export const Dialog = BaseDialog.Root;
export const DialogTrigger = BaseDialog.Trigger;
export const DialogClose = BaseDialog.Close;

export interface DialogContentProps {
  title: ReactNode;
  /** One sentence under the title. Also used as the accessible description. */
  description?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Footer actions, right-aligned. Primary action goes last. */
  footer?: ReactNode;
  hideClose?: boolean;
  className?: string;
  children?: ReactNode;
}

export function DialogContent({
  title,
  description,
  size = 'md',
  footer,
  hideClose,
  className,
  children,
}: DialogContentProps) {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop className={styles.backdrop} />
      <BaseDialog.Popup className={cx(styles.dialog, styles[size], className)}>
        <header className={styles.dialogHeader}>
          <BaseDialog.Title className={styles.dialogTitle}>
            {title}
          </BaseDialog.Title>
          {!hideClose && (
            <BaseDialog.Close className={styles.close} aria-label="Close">
              <X size={16} />
            </BaseDialog.Close>
          )}
        </header>
        {description && (
          <BaseDialog.Description className={styles.dialogDescription}>
            {description}
          </BaseDialog.Description>
        )}
        {children && <div className={styles.dialogBody}>{children}</div>}
        {footer && <footer className={styles.dialogFooter}>{footer}</footer>}
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  );
}

/* -------------------------------------------------------------------- Menu */

export const Menu = BaseMenu.Root;

/** `<MenuTrigger render={<IconButton aria-label="More">…</IconButton>} />` */
export const MenuTrigger = BaseMenu.Trigger;

export function MenuContent({
  side = 'bottom',
  align = 'start',
  className,
  children,
}: {
  side?: Side;
  align?: Align;
  className?: string;
  children: ReactNode;
}) {
  return (
    <BaseMenu.Portal>
      <BaseMenu.Positioner
        side={side}
        align={align}
        sideOffset={6}
        className={styles.positioner}
      >
        <BaseMenu.Popup className={cx(styles.menu, className)}>
          {children}
        </BaseMenu.Popup>
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  );
}

export function MenuItem({
  icon,
  danger,
  shortcut,
  className,
  children,
  ...props
}: Omit<ComponentProps<typeof BaseMenu.Item>, 'className'> & {
  className?: string;
  icon?: ReactNode;
  danger?: boolean;
  shortcut?: string;
}) {
  return (
    <BaseMenu.Item
      className={cx(styles.menuItem, danger && styles.danger, className)}
      {...props}
    >
      {icon && <span className={styles.menuIcon}>{icon}</span>}
      <span className={styles.menuLabel}>{children}</span>
      {shortcut && <kbd className={styles.shortcut}>{shortcut}</kbd>}
    </BaseMenu.Item>
  );
}

export function MenuSeparator() {
  return <BaseMenu.Separator className={styles.separator} />;
}

export function MenuGroupLabel({ children }: { children: ReactNode }) {
  return <div className={styles.groupLabel}>{children}</div>;
}

/* ----------------------------------------------------------------- Popover */

export const Popover = BasePopover.Root;
export const PopoverTrigger = BasePopover.Trigger;
export const PopoverClose = BasePopover.Close;

export function PopoverContent({
  side = 'bottom',
  align = 'center',
  sideOffset = 8,
  title,
  bare,
  anchor,
  initialFocus,
  finalFocus,
  className,
  children,
}: {
  side?: Side;
  align?: Align;
  sideOffset?: number;
  /** Accessible title; shown as a heading. */
  title?: ReactNode;
  /** No padding/background: for pickers that bring their own chrome. */
  bare?: boolean;
  /** Position against this element instead of the trigger. */
  anchor?: ComponentProps<typeof BasePopover.Positioner>['anchor'];
  initialFocus?: ComponentProps<typeof BasePopover.Popup>['initialFocus'];
  finalFocus?: ComponentProps<typeof BasePopover.Popup>['finalFocus'];
  className?: string;
  children: ReactNode;
}) {
  return (
    <BasePopover.Portal>
      <BasePopover.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        anchor={anchor}
        className={styles.positioner}
      >
        <BasePopover.Popup
          initialFocus={initialFocus}
          finalFocus={finalFocus}
          className={cx(bare ? styles.bare : styles.popover, className)}
        >
          {title && (
            <BasePopover.Title className={styles.popoverTitle}>
              {title}
            </BasePopover.Title>
          )}
          {children}
        </BasePopover.Popup>
      </BasePopover.Positioner>
    </BasePopover.Portal>
  );
}

/* ----------------------------------------------------------------- Tooltip */

/** Mount once near the root so neighbouring tooltips open instantly. */
export const TooltipProvider = BaseTooltip.Provider;

/**
 * `<Tooltip content="Mute"><IconButton …/></Tooltip>`. Tooltips repeat or
 * clarify; never put information only in a tooltip.
 */
export function Tooltip({
  content,
  side = 'top',
  shortcut,
  children,
}: {
  content: ReactNode;
  side?: Side;
  shortcut?: string;
  children: ReactElement;
}) {
  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger render={children} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner
          side={side}
          sideOffset={6}
          className={styles.positioner}
        >
          <BaseTooltip.Popup className={styles.tooltip}>
            {content}
            {shortcut && <kbd className={styles.shortcut}>{shortcut}</kbd>}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}
