import { Toast } from '@base-ui/react/toast';
import { Check, CircleAlert, Info, X } from 'lucide-react';

import { Spinner } from './Spinner';
import styles from './Toast.module.css';

const manager = Toast.createToastManager();

export interface ToastOptions {
  /** Name the action and its result: "Message deleted", "Invite copied". */
  title: string;
  description?: string;
  type?: 'info' | 'success' | 'error' | 'loading';
  /** ms; 0 keeps it until dismissed. Errors default to 8s. */
  timeout?: number;
  action?: { label: string; onClick: () => void };
}

/** Show a toast from anywhere, including outside React. Returns its id. */
export function toast({
  title,
  description,
  type = 'info',
  timeout,
  action,
}: ToastOptions): string {
  return manager.add({
    title,
    description,
    type,
    timeout:
      timeout ?? (type === 'error' ? 8000 : type === 'loading' ? 0 : 4000),
    priority: type === 'error' ? 'high' : 'low',
    actionProps: action
      ? { children: action.label, onClick: action.onClick }
      : undefined,
  });
}

toast.close = (id: string) => manager.close(id);
toast.update = (id: string, options: Partial<ToastOptions>) =>
  manager.update(id, {
    ...options,
    ...(options.type &&
    options.type !== 'loading' &&
    options.timeout === undefined
      ? { timeout: 4000 }
      : {}),
  });

function ToastIcon({ type }: { type?: string }) {
  if (type === 'success') return <Check size={15} className={styles.ok} />;
  if (type === 'error')
    return <CircleAlert size={15} className={styles.danger} />;
  if (type === 'loading') return <Spinner size={15} />;
  return <Info size={15} className={styles.muted} />;
}

function ToastList() {
  const { toasts } = Toast.useToastManager();
  return toasts.map((t) => (
    <Toast.Root key={t.id} toast={t} className={styles.toast}>
      <Toast.Content className={styles.content}>
        <ToastIcon type={t.type} />
        <div className={styles.text}>
          <Toast.Title className={styles.title} />
          <Toast.Description className={styles.description} />
        </div>
        {t.actionProps && <Toast.Action className={styles.action} />}
        <Toast.Close className={styles.close} aria-label="Dismiss">
          <X size={14} />
        </Toast.Close>
      </Toast.Content>
    </Toast.Root>
  ));
}

/** Mount once at the app root. */
export function Toaster() {
  return (
    <Toast.Provider toastManager={manager} limit={3}>
      <Toast.Portal>
        <Toast.Viewport className={styles.viewport}>
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}
