import styled from '@emotion/styled';
import SimpleMarkdown, { SingleASTNode } from '@khanacademy/simple-markdown';

import { codeBlockRule } from './rules/CodeBlock';
import { emojiRule } from './rules/Emoji';
import { imageRule } from './rules/Image';
import { linkRule } from './rules/Link';
import { mentionRule } from './rules/Mention';
import { objectRule } from './rules/Object';
import { spoilerRule } from './rules/Spoiler';

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

const rules = {
  ...SimpleMarkdown.defaultRules,
  image: imageRule,
  paragraph: {
    ...SimpleMarkdown.defaultRules.paragraph,
    match: SimpleMarkdown.blockRegex(/^((?:[^\n])+)(?:\n *)+/),
  },

  link: linkRule,
  codeBlock: codeBlockRule,
  object: objectRule,
  emoji: emojiRule,
  spoiler: spoilerRule,
  mention: mentionRule,
};

const MarkdownWrapper = styled.div<{ emojiSize: string }>`
  gap: 8px;
  display: flex;
  flex-direction: column;
  .emoji-mart-emoji img {
    max-width: ${(p) => p.emojiSize} !important;
    max-height: ${(p) => p.emojiSize} !important;
  }

  .paragraph code {
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

function emojiFest(nodes: SingleASTNode[]) {
  // eslint-disable-next-line no-restricted-syntax
  for (const x of nodes) {
    if (x.type === 'paragraph') {
      // eslint-disable-next-line no-restricted-syntax
      for (const y of x.content) {
        if (y.type !== 'emoji') {
          return '1.2em';
        }
      }
    }
  }
  return '3em';
}

const rawBuiltParser = SimpleMarkdown.parserFor(rules as any);
const reactOutput = SimpleMarkdown.outputFor(rules, 'react');

export function Markdown({ content }: { content: string }) {
  const co =
    isUrl(content) && isUrlImage(content)
      ? `![Image Embed](${content})`
      : content;

  const parsed = rawBuiltParser(co, { inline: false });
  const output = reactOutput(parsed);

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <MarkdownWrapper emojiSize={emojiFest(parsed)}>{output}</MarkdownWrapper>
  );
}
