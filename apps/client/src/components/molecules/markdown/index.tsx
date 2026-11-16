import { EMOJI_OBJECT_PATTERN } from '@mikoto-io/mikoto.js';
import ReactMarkdown, { defaultUrlTransform } from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

import { cx } from '@/design';

import styles from './Markdown.module.css';
import { markdownComponents } from './components';
import {
  preprocessEscapes,
  remarkCleanEscapes,
  remarkEmoji,
  remarkMention,
  remarkSpoiler,
} from './plugins';

export { MessageImage } from './components';
export * from './customEmoji';

function isUrl(s: string) {
  let url;

  try {
    url = new URL(s);
  } catch {
    return false;
  }

  return url.protocol === 'http:' || url.protocol === 'https:';
}

function isUrlImage(url: string): boolean {
  return url.match(/\.(jpeg|jpg|gif|png)$/) !== null;
}

const ONE_EMOJI = `(?::(?:\\+1|[-\\w]+):|${EMOJI_OBJECT_PATTERN.source})`;
const EMOJI_ONLY_REGEX = new RegExp(
  `^\\s*${ONE_EMOJI}(?:\\s*${ONE_EMOJI})*\\s*$`,
);

/** Keep `emoji:` object links (`<emoji:ID:name>`), which the default drops. */
function urlTransform(url: string) {
  return url.startsWith('emoji:') ? url : defaultUrlTransform(url);
}

function isEmojiOnly(content: string): boolean {
  return EMOJI_ONLY_REGEX.test(content);
}

const REMARK_PLUGINS = [
  remarkGfm,
  remarkBreaks,
  remarkEmoji,
  remarkMention,
  remarkSpoiler,
  remarkCleanEscapes,
];

export function Markdown({ content }: { content: string }) {
  const co =
    isUrl(content) && isUrlImage(content)
      ? `![Image Embed](${content})`
      : preprocessEscapes(content);

  return (
    <div
      className={cx(styles.markdown, isEmojiOnly(content) && styles.emojiOnly)}
    >
      <ReactMarkdown
        remarkPlugins={REMARK_PLUGINS}
        components={markdownComponents}
        urlTransform={urlTransform}
      >
        {co}
      </ReactMarkdown>
    </div>
  );
}
