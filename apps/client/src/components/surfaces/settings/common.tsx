import { type VerificationChallenge } from '@mikoto-io/mikoto.js';
import { useSetAtom } from 'jotai';
import { Check, Copy, TriangleAlert } from 'lucide-react';
import { type ReactNode, useState } from 'react';

import { modalState } from '@/components/ContextMenu';
import {
  Button,
  DialogClose,
  DialogContent,
  IconButton,
  Skeleton,
  SkeletonGroup,
  cx,
  toast,
} from '@/design';
import {
  ErrorCallout,
  toAppError,
  useErrorElement,
} from '@/hooks/useErrorElement';

import styles from './common.module.css';

export { styles as settingsStyles };

/* ------------------------------------------------------------- save bar */

/**
 * Sticky bar for forms that save explicitly. Render it last inside a
 * <SettingSurface>; it only appears while there are unsaved changes.
 */
export function SaveBar({
  dirty,
  saving,
  onReset,
  onSave,
  form,
}: {
  dirty: boolean;
  saving?: boolean;
  onReset: () => void;
  /** Omit when the bar sits inside a <form> (`form` submits it instead). */
  onSave?: () => void;
  /** id of the form the Save button submits, when rendered outside it. */
  form?: string;
}) {
  if (!dirty && !saving) return null;
  return (
    <div className={styles.saveBar}>
      <div
        className={styles.saveBarInner}
        role="region"
        aria-label="Unsaved changes"
      >
        <span className={styles.saveBarText}>You have unsaved changes</span>
        <Button variant="ghost" size="sm" onClick={onReset} disabled={saving}>
          Reset
        </Button>
        <Button
          variant="primary"
          size="sm"
          loading={saving}
          type={onSave ? 'button' : 'submit'}
          form={form}
          onClick={onSave}
        >
          Save changes
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- lists */

export function SettingsList({ children }: { children: ReactNode }) {
  return <div className={styles.list}>{children}</div>;
}

/** A row in a settings list: leading visual, title + meta, trailing actions. */
export function SettingsRow({
  leading,
  title,
  meta,
  actions,
  onClick,
}: {
  leading?: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  onClick?: () => void;
}) {
  const body = (
    <>
      {leading}
      <div className={styles.rowMain}>
        <div className={styles.rowTitle}>{title}</div>
        {meta && <div className={styles.rowMeta}>{meta}</div>}
      </div>
      {actions && <div className={styles.rowActions}>{actions}</div>}
    </>
  );
  if (onClick) {
    return (
      <button type="button" className={styles.row} onClick={onClick}>
        {body}
      </button>
    );
  }
  return <div className={styles.row}>{body}</div>;
}

/** Mirrors <SettingsRow>: same height, leading square, two text lines. */
export function RowsSkeleton({
  label,
  rows = 3,
  leading = 40,
  action = true,
}: {
  label: string;
  rows?: number;
  /** Size of the leading avatar/icon, or 0 for none. */
  leading?: number;
  action?: boolean;
}) {
  return (
    <SkeletonGroup label={label}>
      <div className={styles.list}>
        {Array.from({ length: rows }, (_, i) => (
          <div className={styles.row} key={i}>
            {leading > 0 && (
              <Skeleton width={leading} height={leading} radius={8} />
            )}
            <div className={styles.rowMain}>
              <Skeleton width={['40%', '55%', '32%'][i % 3]} height={13} />
              <Skeleton width={['25%', '20%', '30%'][i % 3]} height={11} />
            </div>
            {action && <Skeleton width={72} height={28} radius={8} />}
          </div>
        ))}
      </div>
    </SkeletonGroup>
  );
}

export function ListEmpty({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={styles.empty}>
      {icon && <div className={styles.emptyIcon}>{icon}</div>}
      <p className={styles.emptyTitle}>{title}</p>
      {description && <p className={styles.emptyText}>{description}</p>}
      {action && <div className={styles.emptyAction}>{action}</div>}
    </div>
  );
}

/** Generic page skeleton: title, intro, then a few setting rows. */
export function SettingsPageSkeleton({ label }: { label: string }) {
  return (
    <SkeletonGroup label={label} className={styles.skeletonPage}>
      <div className={styles.skeletonText}>
        <Skeleton width={180} height={26} />
        <Skeleton width="60%" height={13} />
      </div>
      <div>
        {[0, 1, 2, 3].map((i) => (
          <div className={styles.skeletonRow} key={i}>
            <div className={styles.skeletonText}>
              <Skeleton width={['30%', '24%', '36%', '28%'][i]} height={14} />
              <Skeleton width={['62%', '48%', '55%', '40%'][i]} height={12} />
            </div>
            <Skeleton width={120} height={30} radius={8} />
          </div>
        ))}
      </div>
    </SkeletonGroup>
  );
}

/* ------------------------------------------------------------- copy */

export async function copyText(text: string, what: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast({ title: `${what} copied`, type: 'success' });
  } catch {
    toast({
      title: `Couldn't copy the ${what.toLowerCase()}`,
      description:
        'Your browser blocked clipboard access. Select the text and copy it instead.',
      type: 'error',
    });
  }
}

/** A read-only value with a copy button (IDs, tokens, DNS records). */
export function CopyField({
  value,
  display,
  what,
  extra,
  className,
}: {
  value: string;
  /** What to show instead of the value (e.g. a masked token). */
  display?: ReactNode;
  /** Names the thing in the toast: "Bot ID" → "Bot ID copied". */
  what: string;
  extra?: ReactNode;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className={cx(styles.copy, className)}>
      <code className={styles.copyValue}>{display ?? value}</code>
      {extra}
      <IconButton
        aria-label={`Copy ${what.toLowerCase()}`}
        onClick={async () => {
          await copyText(value, what);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? <Check size={15} /> : <Copy size={15} />}
      </IconButton>
    </div>
  );
}

export function WarningNote({ children }: { children: ReactNode }) {
  return (
    <div className={styles.warn} role="note">
      <TriangleAlert size={15} aria-hidden />
      <span>{children}</span>
    </div>
  );
}

/* ------------------------------------------------------------- confirm */

/**
 * Confirmation for irreversible actions. Open it through the modal kit:
 * `setModal({ elem: <ConfirmDialog … /> })`. Failures show inline and keep
 * the dialog open.
 */
export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  onConfirm,
  children,
  canConfirm = true,
}: {
  title: string;
  description: ReactNode;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
  children?: ReactNode;
  canConfirm?: boolean;
}) {
  const setModal = useSetAtom(modalState);
  const [busy, setBusy] = useState(false);
  const error = useErrorElement();

  return (
    <DialogContent
      size="sm"
      title={title}
      description={description}
      footer={
        <>
          <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
          <Button
            variant="danger"
            loading={busy}
            disabled={!canConfirm}
            onClick={async () => {
              setBusy(true);
              error.setError(null);
              try {
                await onConfirm();
                setModal(null);
              } catch (e) {
                error.setError(e);
              } finally {
                setBusy(false);
              }
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {(children || error.el) && (
        <div className={styles.methods}>
          {error.el}
          {children}
        </div>
      )}
    </DialogContent>
  );
}

/* ------------------------------------------------- handle verification */

/** Default handles look like `name.mikoto.io`; any other dotted handle is a custom domain. */
export function isCustomDomain(handle: string) {
  if (!handle.includes('.')) return false;
  const parts = handle.split('.');
  return !(parts.length === 3 && handle.endsWith('.mikoto.io'));
}

export function HandleVerificationModal({
  challenge,
  subject,
  onVerify,
}: {
  challenge: VerificationChallenge;
  /** "your" or "this space's" */
  subject: string;
  onVerify: () => Promise<void>;
}) {
  const setModal = useSetAtom(modalState);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    setVerifying(true);
    setError(null);
    try {
      await onVerify();
      toast({ title: `Handle set to @${challenge.handle}`, type: 'success' });
      setModal(null);
    } catch (e) {
      setError(
        toAppError(e)?.message ??
          "We couldn't find the record yet. DNS changes can take a few minutes, so try again shortly.",
      );
    } finally {
      setVerifying(false);
    }
  };

  return (
    <DialogContent
      size="lg"
      title="Verify your domain"
      description={
        <>
          To use <strong>{challenge.handle}</strong> as {subject} handle, prove
          you own the domain with either method below, then select Verify
          domain.
        </>
      }
      footer={
        <>
          <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
          <Button variant="primary" onClick={handleVerify} loading={verifying}>
            Verify domain
          </Button>
        </>
      }
    >
      <div className={styles.methods}>
        {error && (
          <ErrorCallout onDismiss={() => setError(null)}>{error}</ErrorCallout>
        )}
        <div className={styles.method}>
          <p className={styles.methodTitle}>Add a DNS TXT record</p>
          <p className={styles.note}>Record name</p>
          <CopyField value={challenge.dnsTxtName} what="Record name" />
          <p className={styles.note}>Record value</p>
          <CopyField value={challenge.dnsTxtRecord} what="Record value" />
        </div>
        <div className={styles.method}>
          <p className={styles.methodTitle}>Or host a file on your site</p>
          <p className={styles.note}>File URL</p>
          <CopyField value={challenge.wellKnownUrl} what="URL" />
          <p className={styles.note}>File contents</p>
          <CopyField value={challenge.wellKnownContent} what="File contents" />
        </div>
      </div>
    </DialogContent>
  );
}
