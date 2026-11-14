import { Camera } from 'lucide-react';
import { useState } from 'react';
import { useDropzone } from 'react-dropzone';

import { Avatar } from '@/components/atoms/Avatar';
import { Spinner, cx, toast } from '@/design';
import { toAppError } from '@/hooks/useErrorElement';

import styles from './AvatarEditor.module.css';

/**
 * Click or drop an image to replace an avatar or icon. Shows progress while
 * `onDrop` runs and reports the outcome with a toast.
 */
export function AvatarEditor({
  avatar,
  onDrop,
  size = 64,
  what = 'avatar',
}: {
  avatar?: string;
  onDrop?: (file: File) => void | Promise<void>;
  size?: number;
  /** Names the image in labels and toasts: "avatar", "icon". */
  what?: string;
}) {
  const [busy, setBusy] = useState(false);
  const capitalized = what.charAt(0).toUpperCase() + what.slice(1);

  const upload = useDropzone({
    accept: { 'image/*': [] },
    multiple: false,
    disabled: busy,
    onDropRejected: () => {
      toast({
        title: `Couldn't use that file as your ${what}`,
        description: 'Choose a PNG, JPEG, GIF or WebP image.',
        type: 'error',
      });
    },
    onDropAccepted: async (files) => {
      const file = files[0];
      if (!file || !onDrop) return;
      setBusy(true);
      try {
        await onDrop(file);
        toast({ title: `${capitalized} updated`, type: 'success' });
      } catch (e) {
        toast({
          title: `Couldn't update the ${what}`,
          description: toAppError(e)?.message,
          type: 'error',
        });
      } finally {
        setBusy(false);
      }
    },
  });

  return (
    <div
      {...upload.getRootProps({
        className: cx(
          styles.editor,
          upload.isDragActive && styles.dragging,
          busy && styles.busy,
        ),
        style: { '--size': `${size}px` },
        role: 'button',
        'aria-label': `Change ${what}`,
        'aria-busy': busy || undefined,
      })}
    >
      <input {...upload.getInputProps()} />
      <Avatar size={size} src={avatar} />
      <span className={styles.overlay} aria-hidden>
        {busy ? (
          <Spinner size={18} />
        ) : (
          <>
            <Camera size={18} />
            Change
          </>
        )}
      </span>
    </div>
  );
}
