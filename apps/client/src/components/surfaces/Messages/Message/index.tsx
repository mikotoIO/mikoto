import type { MikotoMessage } from '@mikoto-io/mikoto.js';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import {
  Bot,
  CircleAlert,
  Copy,
  Ellipsis,
  FileText,
  Pencil,
  Trash2,
} from 'lucide-react';
import { type ReactNode, useRef } from 'react';
import { useSnapshot } from 'valtio/react';

import {
  ContextMenu,
  contextMenuState,
  useContextMenu,
} from '@/components/ContextMenu';
import { normalizeMediaUrl } from '@/components/atoms/Avatar';
import {
  MemberContextMenu,
  MessageAvatar,
  roleNameProps,
} from '@/components/atoms/MessageAvatar';
import { Markdown, MessageImage } from '@/components/molecules/markdown';
import {
  IconButton,
  ItemErrorBoundary,
  RoleName,
  Skeleton,
  Tag,
  cx,
  describeError,
  toast,
} from '@/design';
import { useMikoto } from '@/hooks';

import styles from './Message.module.css';
import { Timestamp } from './Timestamp';

export { Timestamp } from './Timestamp';

/** The message currently being edited in the composer, if any. */
export const messageEditState = atom<MikotoMessage | null>(null);

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Whether `content` @-mentions the given handle (as the markdown renders it). */
export function mentionsHandle(content: string, handle?: string | null) {
  if (!handle) return false;
  return new RegExp(
    `(^|[^\\w\\\\])@${escapeRegExp(handle)}(?![\\w.])`,
    'i',
  ).test(content);
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast({ type: 'success', title: 'Copied message text' });
  } catch {
    toast({
      type: 'error',
      title: "Couldn't copy the message",
      description: 'Your browser blocked clipboard access.',
    });
  }
}

async function deleteMessage(message: MikotoMessage) {
  try {
    await message.delete();
  } catch (err) {
    toast({
      type: 'error',
      title: "Couldn't delete the message",
      description: describeError(err, { context: 'action' }).message,
    });
  }
}

export interface MessageItemProps {
  message: MikotoMessage;
  /** A continuation of the previous author's group: no avatar or header. */
  isSimple?: boolean;
  /** Messages in a space get role-colored names; DMs never do. */
  inSpace?: boolean;
  /** Set when sending this (optimistic) message failed. */
  failed?: boolean;
  onRetry?: () => void;
  onDiscard?: () => void;
}

function MessageRow({
  message,
  isSimple,
  inSpace,
  failed,
  onRetry,
  onDiscard,
}: MessageItemProps) {
  const messageSnap = useSnapshot(message);
  const mikoto = useMikoto();
  const setEditState = useSetAtom(messageEditState);
  const editing = useAtomValue(messageEditState);
  const setContextMenu = useSetAtom(contextMenuState);
  const nameRef = useRef<HTMLButtonElement>(null);

  const me = mikoto.user.me;
  const isMine = !!me && message.authorId === me.id;
  const isPending = !!messageSnap.pending;
  const member = inSpace ? message.member : undefined;
  const author = member?.user ?? messageSnap.author ?? undefined;
  const authorName = author?.name ?? 'Deleted user';
  const timestamp = new Date(messageSnap.timestamp);
  const mentionsMe =
    !isMine && !isPending && mentionsHandle(messageSnap.content, me?.handle);

  const menuItems = (): ReactNode => (
    <ContextMenu>
      {isMine && (
        <ContextMenu.Item
          icon={<Pencil size={15} />}
          onClick={() => setEditState(message)}
        >
          Edit message
        </ContextMenu.Item>
      )}
      <ContextMenu.Item
        icon={<Copy size={15} />}
        onClick={() => copyText(message.content)}
      >
        Copy text
      </ContextMenu.Item>
      <ContextMenu.Separator />
      <ContextMenu.Item
        icon={<Trash2 size={15} />}
        danger
        onClick={() => deleteMessage(message)}
      >
        Delete message
      </ContextMenu.Item>
    </ContextMenu>
  );
  const onContextMenu = useContextMenu(menuItems);

  const openMoreMenu = (el: HTMLElement) => {
    const { bottom, right } = el.getBoundingClientRect();
    setContextMenu({
      position: { top: bottom + 4, right: window.innerWidth - right },
      elem: menuItems(),
    });
  };

  const openProfileCard = () => {
    if (!author || !nameRef.current) return;
    const { top, right } = nameRef.current.getBoundingClientRect();
    setContextMenu({
      position: { top, left: right + 8 },
      elem: <MemberContextMenu member={member} user={author} />,
    });
  };

  const attachments = messageSnap.attachments ?? [];

  return (
    <article
      className={cx(
        styles.msg,
        isSimple && styles.cont,
        mentionsMe && styles.mention,
        (isPending || failed) && styles.pending,
      )}
      aria-label={`${authorName}, ${timestamp.toLocaleString()}`}
      onContextMenu={isPending ? undefined : onContextMenu}
    >
      {isSimple ? (
        <Timestamp className={styles.gutterTime} time={timestamp} timeOnly />
      ) : (
        <div className={styles.avatarCell}>
          <MessageAvatar
            member={member}
            src={author?.avatar ?? undefined}
            user={author}
          />
        </div>
      )}
      <div className={styles.main}>
        {!isSimple && (
          <header className={styles.head}>
            <button
              ref={nameRef}
              type="button"
              className={styles.name}
              disabled={!author}
              onClick={openProfileCard}
            >
              <RoleName
                name={authorName}
                {...(inSpace ? roleNameProps(member) : {})}
              />
            </button>
            {author?.category === 'BOT' && (
              <Tag>
                <Bot size={12} aria-hidden />
                Bot
              </Tag>
            )}
            <Timestamp className={styles.time} time={timestamp} />
          </header>
        )}
        <div className={styles.body}>
          <Markdown content={messageSnap.content} />
          {messageSnap.editedTimestamp && (
            <span
              className={styles.edited}
              title={`Edited ${new Date(messageSnap.editedTimestamp).toLocaleString()}`}
            >
              (edited)
            </span>
          )}
        </div>
        {attachments.length > 0 && (
          <div className={styles.attachments}>
            {attachments.map((attachment) => {
              const url = normalizeMediaUrl(attachment.url);
              if (attachment.contentType.startsWith('image/')) {
                return (
                  <ItemErrorBoundary key={attachment.id} what="This image">
                    <MessageImage src={url} alt={attachment.filename} />
                  </ItemErrorBoundary>
                );
              }
              return (
                <a
                  key={attachment.id}
                  className={styles.file}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FileText className={styles.fileIcon} size={20} aria-hidden />
                  <span className={styles.fileText}>
                    <span className={styles.fileName}>
                      {attachment.filename}
                    </span>
                    <span className={styles.fileSize}>
                      {formatSize(attachment.size)}
                    </span>
                  </span>
                </a>
              );
            })}
          </div>
        )}
        {failed && (
          <div className={cx(styles.status, styles.failed)} role="alert">
            <CircleAlert size={14} aria-hidden />
            Not sent.
            {onRetry && (
              <button type="button" className={styles.link} onClick={onRetry}>
                Try again
              </button>
            )}
            {onDiscard && (
              <button type="button" className={styles.link} onClick={onDiscard}>
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {!isPending && !failed && editing?.id !== message.id && (
        <div
          className={styles.actions}
          role="toolbar"
          aria-label="Message actions"
        >
          {isMine && (
            <IconButton
              aria-label="Edit message"
              onClick={() => setEditState(message)}
            >
              <Pencil size={16} />
            </IconButton>
          )}
          {isMine && (
            <IconButton
              aria-label="Delete message"
              onClick={() => deleteMessage(message)}
            >
              <Trash2 size={16} />
            </IconButton>
          )}
          <IconButton
            aria-label="More actions"
            aria-haspopup="menu"
            onClick={(ev) => {
              ev.stopPropagation();
              openMoreMenu(ev.currentTarget);
            }}
          >
            <Ellipsis size={16} />
          </IconButton>
        </div>
      )}
    </article>
  );
}

/** One message. A message that fails to render shows a one-line notice. */
export function MessageItem(props: MessageItemProps) {
  return (
    <ItemErrorBoundary
      what="This message"
      className={styles.broken}
      resetKeys={[props.message]}
    >
      <MessageRow {...props} />
    </ItemErrorBoundary>
  );
}

/** Skeleton rows shaped like grouped messages, for first load and paging. */
export function MessageSkeleton({ index }: { index: number }) {
  const widths = [82, 64, 90, 55, 74, 68, 88, 60];
  return (
    <div className={styles.skeleton} aria-hidden>
      <Skeleton circle width="var(--av)" />
      <div className={styles.skeletonLines}>
        <Skeleton width={90 + ((index * 13) % 60)} height={12} />
        <Skeleton width={`${widths[index % widths.length]}%`} height={12} />
        {index % 3 === 0 && (
          <Skeleton
            width={`${widths[(index + 3) % widths.length] - 20}%`}
            height={12}
          />
        )}
      </div>
    </div>
  );
}
