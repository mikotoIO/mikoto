import { parseEmojiHref } from '@mikoto-io/mikoto.js';
import { useSetAtom } from 'jotai';
import { ExternalLink, ImageOff, Link2Off } from 'lucide-react';
import { Suspense, lazy, useState } from 'react';
import type { Components } from 'react-markdown';

import { modalState } from '@/components/ContextMenu';
import { DialogContent, ItemErrorBoundary, Tooltip } from '@/design';

import styles from './Markdown.module.css';
import { useCustomEmojiById } from './customEmoji';

const CodeHighlight = lazy(() => import('./rules/CodeBlock/CodeHighlight'));
const EmojiElement = lazy(() => import('./EmojiElement'));

function ImagePreview({ src, alt }: { src: string; alt?: string }) {
  return (
    <DialogContent
      size="lg"
      title={alt || 'Image'}
      footer={
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.openLink}
        >
          <ExternalLink size={14} aria-hidden />
          Open original
        </a>
      }
    >
      <img className={styles.lightbox} src={src} alt={alt ?? ''} />
    </DialogContent>
  );
}

/**
 * An image in a message. Clicking opens a larger preview; a broken URL shows
 * a muted placeholder instead of the browser's broken-image icon.
 */
export function MessageImage({ src, alt }: { src?: string; alt?: string }) {
  const setModal = useSetAtom(modalState);
  const [failed, setFailed] = useState<string | null>(null);

  if (!src || failed === src) {
    return (
      <span className={styles.imageMissing} role="img" aria-label={alt}>
        <ImageOff size={16} aria-hidden />
        {alt && alt !== 'Image Embed' ? alt : "This image couldn't be loaded"}
      </span>
    );
  }

  return (
    <button
      type="button"
      className={styles.imageButton}
      aria-label={alt ? `Open image: ${alt}` : 'Open image'}
      onClick={() => {
        setModal({ elem: <ImagePreview src={src} alt={alt} /> });
      }}
    >
      <img
        className={styles.image}
        src={src}
        alt={alt ?? ''}
        loading="lazy"
        onError={() => setFailed(src)}
      />
    </button>
  );
}

function Spoiler({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = useState(true);
  return (
    <button
      type="button"
      className={styles.spoiler}
      aria-pressed={!hidden}
      aria-label={hidden ? 'Spoiler, select to reveal' : undefined}
      onClick={() => setHidden((h) => !h)}
    >
      {children}
    </button>
  );
}

/**
 * A custom emoji, written `<emoji:ID:name>`. Unknown ones (deleted, or from
 * a space we aren't in) show as `:name:`.
 */
function CustomEmojiElement({ id, name }: { id: string; name: string }) {
  const custom = useCustomEmojiById(id);
  const [failed, setFailed] = useState(false);
  const label = `:${custom?.name ?? name}:`;
  if (!custom || failed) {
    return <span className={styles.emojiFallback}>{label}</span>;
  }
  return (
    <Tooltip content={label}>
      <span className={styles.emoji}>
        <img
          className={styles.customEmoji}
          src={custom.url}
          alt={label}
          draggable={false}
          onError={() => setFailed(true)}
        />
      </span>
    </Tooltip>
  );
}

function ObjectNotFound({ resource }: { resource: string }) {
  return (
    <span className={styles.notFound}>
      <Link2Off size={14} aria-hidden />
      Can't show this {resource} link
    </span>
  );
}

/** Small boundary so one bad embed doesn't take down its message. */
function EmbedBoundary({
  what,
  children,
}: {
  what: string;
  children: React.ReactNode;
}) {
  return <ItemErrorBoundary what={what}>{children}</ItemErrorBoundary>;
}

export const markdownComponents: Partial<Components> = {
  a({ href, children }) {
    const emoji = href ? parseEmojiHref(href) : null;
    if (emoji) return <CustomEmojiElement id={emoji.id} name={emoji.name} />;
    // Intercept autolinks with non-http schemes like <type:data>
    if (href && !/^https?:\/\//.test(href)) {
      const match = /^(\w+):(.*)$/.exec(href);
      if (match) {
        return <ObjectNotFound resource={match[1]} />;
      }
    }
    return (
      <a href={href ?? '#'} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  },

  img({ src, alt }) {
    return (
      <EmbedBoundary what="This image">
        <MessageImage
          src={typeof src === 'string' ? src : undefined}
          alt={alt}
        />
      </EmbedBoundary>
    );
  },

  pre({ children }) {
    return <div className={styles.codeBlock}>{children}</div>;
  },

  code({ className, children }) {
    const langMatch = className?.match(/language-(\S+)/);
    if (langMatch) {
      const language = langMatch[1];
      const content = String(children).replace(/\n$/, '');
      const plain = (
        <pre>
          <code>{content}</code>
        </pre>
      );
      return (
        <EmbedBoundary what="This code block">
          <Suspense fallback={plain}>
            <CodeHighlight language={language} content={content} />
          </Suspense>
        </EmbedBoundary>
      );
    }
    return <code>{children}</code>;
  },

  // Custom elements mapped from remark plugins via data.hName
  // @ts-expect-error custom element
  mention({ username }: { username: string }) {
    return <span className={styles.mention}>@{username}</span>;
  },

  'emoji-shortcode'({ emoji }: { emoji: string }) {
    return (
      <Suspense fallback={`:${emoji}:`}>
        <EmojiElement emoji={emoji} />
      </Suspense>
    );
  },

  spoiler({ content }: { content: string }) {
    return <Spoiler>{content}</Spoiler>;
  },
};
