import styled from '@emotion/styled';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

import { markdownComponents } from './components';
import {
  preprocessEscapes,
  remarkCleanEscapes,
  remarkEmoji,
  remarkMention,
  remarkSpoiler,
} from './plugins';

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

const EMOJI_ONLY_REGEX = /^(\s*:(\+1|[-\w]+):\s*)+$/;

function isEmojiOnly(content: string): boolean {
  return EMOJI_ONLY_REGEX.test(content);
}

const MarkdownWrapper = styled.div<{ emojiSize: string }>`
  gap: 8px;
  display: flex;
  flex-direction: column;
  .emoji-mart-emoji img {
    max-width: ${(p) => p.emojiSize} !important;
    max-height: ${(p) => p.emojiSize} !important;
  }

  p code {
    border-radius: 4px;
    padding: 2px;
    background-color: var(--chakra-colors-gray-800);
  }

  blockquote {
    margin: 0;
    padding-left: 8px;
    border-left: 3px solid var(--chakra-colors-gray-500);
  }

  table {
    border-collapse: collapse;

    th,
    td {
      border: 1px solid var(--chakra-colors-gray-650);
      padding: 8px 12px;
    }
  }
`;

export function Markdown({ content }: { content: string }) {
  const co =
    isUrl(content) && isUrlImage(content)
      ? `![Image Embed](${content})`
      : preprocessEscapes(content);

  const emojiSize = isEmojiOnly(content) ? '3em' : '1.2em';

  return (
    <MarkdownWrapper emojiSize={emojiSize}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks, remarkEmoji, remarkMention, remarkSpoiler, remarkCleanEscapes]}
        components={markdownComponents}
      >
        {co}
      </ReactMarkdown>
    </MarkdownWrapper>
  );
}
