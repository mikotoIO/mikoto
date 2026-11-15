import { atom, useAtom, useSetAtom } from 'jotai';
import React, {
  type ComponentProps,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { Dialog, MenuCheck, cx } from '@/design';

import styles from './ContextMenu.module.css';

/*
 * Imperative context menus: `onContextMenu={useContextMenu(() => <Menu/>)}`.
 * One menu is open at a time; it closes on outside click, Escape, scroll,
 * blur, or after an item is chosen.
 */

interface Positions {
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
}

interface ContextMenuData {
  position: Positions;
  elem: React.ReactNode;
}

export const contextMenuState = atom<ContextMenuData | null>(null);

const MARGIN = 8;

export function ContextMenuKit() {
  const [context, setContext] = useAtom(contextMenuState);
  const ref = useRef<HTMLDivElement>(null);
  const [placed, setPlaced] = useState<{ top: number; left: number } | null>(
    null,
  );

  // Measure, then clamp into the viewport on both axes. This has to be a
  // layout effect: the size is only known after render, and placing before
  // paint avoids a visible jump. Content can also change size after opening
  // (lazy-loaded pickers, Suspense), so re-place whenever it resizes;
  // otherwise a bottom-anchored menu would grow off the screen.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!context || !el) {
      // eslint-disable-next-line @eslint-react/set-state-in-effect
      setPlaced(null);
      return;
    }
    const place = () => {
      const width = el.offsetWidth;
      const height = el.offsetHeight;
      const p = context.position;
      let left = p.left ?? window.innerWidth - (p.right ?? 0) - width;
      let top = p.top ?? window.innerHeight - (p.bottom ?? 0) - height;
      if (left + width > window.innerWidth - MARGIN) left -= width;
      if (top + height > window.innerHeight - MARGIN) {
        top = window.innerHeight - MARGIN - height;
      }
      // eslint-disable-next-line @eslint-react/set-state-in-effect
      setPlaced({
        left: Math.max(MARGIN, left),
        top: Math.max(MARGIN, top),
      });
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(el);
    return () => observer.disconnect();
  }, [context]);

  // Focus the first item so keyboard users land inside the menu.
  useEffect(() => {
    if (placed) {
      ref.current
        ?.querySelector<HTMLElement>('[role="menuitem"]:not([aria-disabled])')
        ?.focus({ preventScroll: true });
    }
  }, [placed]);

  useEffect(() => {
    if (!context) return;
    const close = () => setContext(null);
    const onPointer = (ev: Event) => {
      if (ev.target instanceof Node && ref.current?.contains(ev.target)) return;
      close();
    };
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') close();
    };
    window.addEventListener('pointerdown', onPointer, true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('blur', close);
    window.addEventListener('resize', close);
    window.addEventListener('wheel', close, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', onPointer, true);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('blur', close);
      window.removeEventListener('resize', close);
      window.removeEventListener('wheel', close);
    };
  }, [context, setContext]);

  if (!context) return null;

  return (
    <div
      ref={ref}
      className={styles.layer}
      style={
        placed
          ? { top: placed.top, left: placed.left }
          : { top: 0, left: 0, visibility: 'hidden' }
      }
      onKeyDown={(ev) => {
        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(ev.key)) return;
        ev.preventDefault();
        const items = Array.from(
          ref.current?.querySelectorAll<HTMLElement>(
            '[role="menuitem"]:not([aria-disabled])',
          ) ?? [],
        );
        if (!items.length) return;
        const i = items.findIndex((el) => el === document.activeElement);
        const next =
          ev.key === 'Home'
            ? 0
            : ev.key === 'End'
              ? items.length - 1
              : ev.key === 'ArrowDown'
                ? (i + 1) % items.length
                : (i - 1 + items.length) % items.length;
        items[next].focus();
      }}
    >
      {context.elem}
    </div>
  );
}

function ContextMenuRoot({ className, ...props }: ComponentProps<'div'>) {
  return <div role="menu" className={cx(styles.menu, className)} {...props} />;
}

interface ItemProps extends Omit<ComponentProps<'button'>, 'onClick'> {
  onClick?: (ev: React.MouseEvent<HTMLButtonElement>) => void;
  icon?: ReactNode;
  /** Destructive actions (delete, leave, ban) are red. */
  danger?: boolean;
  shortcut?: string;
  /** The current choice in a set (e.g. notification level): a check on the right. */
  checked?: boolean;
}

function ContextMenuItem({
  onClick,
  icon,
  danger,
  shortcut,
  checked,
  disabled,
  className,
  children,
  ...props
}: ItemProps) {
  const setContextMenu = useSetAtom(contextMenuState);
  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      aria-disabled={disabled || undefined}
      className={cx(styles.item, danger && styles.danger, className)}
      onClick={(e) => {
        if (disabled) return;
        onClick?.(e);
        setContextMenu(null);
      }}
      {...props}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      <span className={styles.label}>{children}</span>
      {shortcut && <kbd className={styles.shortcut}>{shortcut}</kbd>}
      {checked && <MenuCheck className={styles.check} />}
    </button>
  );
}

function ContextMenuSeparator() {
  return <div role="separator" className={styles.separator} />;
}

function ContextMenuLabel({ children }: { children: ReactNode }) {
  return <div className={styles.groupLabel}>{children}</div>;
}

export const ContextMenu = Object.assign(ContextMenuRoot, {
  Item: ContextMenuItem,
  /** @deprecated use ContextMenu.Item */
  Link: ContextMenuItem,
  Separator: ContextMenuSeparator,
  Label: ContextMenuLabel,
});

interface ContextMenuFns {
  destroy(): void;
}

export function useContextMenuX(position?: Positions) {
  const setContextMenu = useSetAtom(contextMenuState);
  return (Elem: React.ReactNode | React.FC) => (ev: React.MouseEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
    setContextMenu({
      position: position ?? { top: ev.clientY, left: ev.clientX },
      elem: Elem instanceof Function ? <Elem /> : Elem,
    });
  };
}

export function useContextMenu(
  fn: (fns: ContextMenuFns) => React.ReactNode,
  position?: Positions,
) {
  const setContextMenu = useSetAtom(contextMenuState);
  return (ev: React.MouseEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
    setContextMenu({
      position: position ?? { top: ev.clientY, left: ev.clientX },
      elem: fn({
        destroy() {
          setContextMenu(null);
        },
      }),
    });
  };
}

/* ------------------------------------------------------------------ modals
 * `useModalKit()(<MyModal/>)` or `setModal({ elem })`. The element should
 * render a <DialogContent> from '@/design'.
 */
interface ModalData {
  elem: React.ReactNode;
}

export const modalState = atom<ModalData | null>(null);

export function ModalKit() {
  const [modal, setModal] = useAtom(modalState);
  return (
    <Dialog
      open={modal !== null}
      onOpenChange={(open) => {
        if (!open) setModal(null);
      }}
    >
      {modal?.elem}
    </Dialog>
  );
}
