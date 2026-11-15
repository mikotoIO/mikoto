import type { MikotoEmoji, MikotoSpace } from '@mikoto-io/mikoto.js';
import { permissions } from '@mikoto-io/permcheck';
import { useSetAtom } from 'jotai';
import { Pencil, Smile, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import { useSnapshot } from 'valtio/react';

import { modalState } from '@/components/ContextMenu';
import { normalizeMediaUrl } from '@/components/atoms/Avatar';
import { Button, IconButton, Input, PageTitle, toast } from '@/design';
import { uploadFile } from '@/functions/fileUpload';
import { toAppError } from '@/hooks/useErrorElement';
import { SettingSurface } from '@/views';

import { ConfirmDialog, ListEmpty, SettingsList, SettingsRow } from '../common';
import styles from './Emojis.module.css';
import {
  EMOJI_NAME,
  EMOJI_TYPES,
  MAX_EMOJI_BYTES,
  emojiNameFromFile,
} from './emojiName';

/** Mirrors the server's per-space limit. */
const MAX_EMOJIS = 200;

function errorMessage(e: unknown) {
  return toAppError(e)?.message;
}

function RenameField({
  emoji,
  onDone,
}: {
  emoji: MikotoEmoji;
  onDone: () => void;
}) {
  const [value, setValue] = useState(emoji.name);
  const [busy, setBusy] = useState(false);
  const valid = EMOJI_NAME.test(value);

  const save = async () => {
    if (value === emoji.name) return onDone();
    if (!valid) return;
    setBusy(true);
    try {
      await emoji.rename(value);
      onDone();
    } catch (e) {
      toast({
        type: 'error',
        title: `Couldn't rename :${emoji.name}:`,
        description: errorMessage(e),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      className={styles.rename}
      onSubmit={(ev) => {
        ev.preventDefault();
        void save();
      }}
    >
      <Input
        // The field appears in response to the Rename button.
        autoFocus
        aria-label="Emoji name"
        aria-invalid={!valid}
        value={value}
        maxLength={32}
        spellCheck={false}
        disabled={busy}
        onChange={(ev) => setValue(ev.target.value)}
        onKeyDown={(ev) => {
          if (ev.key === 'Escape') {
            ev.preventDefault();
            onDone();
          }
        }}
      />
      <Button size="sm" type="submit" loading={busy} disabled={!valid}>
        Save
      </Button>
      <Button size="sm" variant="ghost" onClick={onDone}>
        Cancel
      </Button>
    </form>
  );
}

function EmojiRow({
  emoji,
  canManage,
}: {
  emoji: MikotoEmoji;
  canManage: boolean;
}) {
  const snap = useSnapshot(emoji);
  const setModal = useSetAtom(modalState);
  const [renaming, setRenaming] = useState(false);

  return (
    <SettingsRow
      leading={
        <img
          className={styles.image}
          src={normalizeMediaUrl(snap.image)}
          alt={`:${snap.name}:`}
          width={32}
          height={32}
        />
      }
      title={
        renaming ? (
          <RenameField emoji={emoji} onDone={() => setRenaming(false)} />
        ) : (
          <span className={styles.name}>:{snap.name}:</span>
        )
      }
      actions={
        canManage &&
        !renaming && (
          <>
            <IconButton
              aria-label={`Rename :${snap.name}:`}
              onClick={() => setRenaming(true)}
            >
              <Pencil size={16} />
            </IconButton>
            <IconButton
              aria-label={`Delete :${snap.name}:`}
              onClick={() =>
                setModal({
                  elem: (
                    <ConfirmDialog
                      title={`Delete :${snap.name}:?`}
                      description="It disappears from messages that use it, and its reactions are removed. This can't be undone."
                      confirmLabel="Delete emoji"
                      onConfirm={async () => {
                        await emoji.delete();
                        toast({
                          title: `:${snap.name}: deleted`,
                          type: 'success',
                        });
                      }}
                    />
                  ),
                })
              }
            >
              <Trash2 size={16} />
            </IconButton>
          </>
        )
      }
    />
  );
}

function useEmojiUpload(space: MikotoSpace) {
  const [uploading, setUploading] = useState(0);

  const uploadOne = async (file: File) => {
    if (file.size > MAX_EMOJI_BYTES) {
      toast({
        type: 'error',
        title: `${file.name} is too large`,
        description: 'Emoji images can be at most 512 KB.',
      });
      return;
    }
    const name = emojiNameFromFile(
      file.name,
      space.emojis.values().map((e) => e.name),
    );
    try {
      const { data } = await uploadFile('/emoji', file);
      await space.emojis.create({ name, image: data.url });
      toast({ type: 'success', title: `Added :${name}:` });
    } catch (e) {
      toast({
        type: 'error',
        title: `Couldn't add ${file.name}`,
        description: errorMessage(e),
      });
    }
  };

  const dropzone = useDropzone({
    accept: Object.fromEntries(EMOJI_TYPES.map((t) => [t, []])),
    noClick: true,
    noKeyboard: true,
    onDropRejected: (rejections) => {
      for (const { file } of rejections) {
        toast({
          type: 'error',
          title: `Can't use ${file.name}`,
          description: 'Emoji must be PNG, GIF, WebP or JPEG images.',
        });
      }
    },
    onDropAccepted: async (files) => {
      setUploading((n) => n + files.length);
      // One at a time, so name collisions within a batch are avoided.
      for (const file of files) {
        await uploadOne(file);
        setUploading((n) => n - 1);
      }
    },
  });

  return { dropzone, uploading: uploading > 0 };
}

export function EmojiSubsurface({ space }: { space: MikotoSpace }) {
  const { t } = useTranslation();
  // Re-render on emoji changes; rows need the live objects to act on them.
  useSnapshot(space.emojis.cache);
  const emojis = space.emojis.values();
  const canManage =
    space.member?.checkPermission(permissions.manageEmojis) ?? false;
  const { dropzone, uploading } = useEmojiUpload(space);
  const full = emojis.length >= MAX_EMOJIS;

  const uploadButton = canManage && (
    <Button loading={uploading} disabled={full} onClick={() => dropzone.open()}>
      <Upload size={16} aria-hidden />
      Upload emoji
    </Button>
  );

  return (
    <SettingSurface>
      <div
        {...dropzone.getRootProps({
          className: styles.root,
          'aria-label': undefined,
        })}
        data-dragging={(canManage && dropzone.isDragActive) || undefined}
      >
        <input {...dropzone.getInputProps()} disabled={!canManage || full} />
        <PageTitle
          title={t('spaceSettings.emojis.title')}
          description="Custom emoji that everyone in this space can use in messages and reactions. Type :name: to use one."
        />
        {emojis.length === 0 ? (
          <ListEmpty
            icon={<Smile size={18} />}
            title="No custom emoji yet"
            description={
              canManage
                ? 'Upload PNG, GIF, WebP or JPEG images up to 512 KB, or drop them here. Square images look best.'
                : 'People who can manage emoji can add them here.'
            }
            action={uploadButton}
          />
        ) : (
          <>
            <div className={styles.toolbar}>
              <span className={styles.count}>
                {emojis.length} of {MAX_EMOJIS} emoji
              </span>
              {uploadButton}
            </div>
            {canManage && (
              <p className={styles.hint}>
                PNG, GIF, WebP or JPEG, up to 512 KB. Drop images anywhere on
                this page to add several at once.
              </p>
            )}
            <SettingsList>
              {emojis.map((emoji) => (
                <EmojiRow key={emoji.id} emoji={emoji} canManage={canManage} />
              ))}
            </SettingsList>
          </>
        )}
      </div>
    </SettingSurface>
  );
}
