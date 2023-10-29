import SimpleMarkdown, { SingleASTNode } from '@khanacademy/simple-markdown';
import { Anchor } from '@mikoto-io/lucid';
import Highlight from 'react-highlight';
import styled, { css } from 'styled-components';

import { emojiRule } from './Emoji';
import { MessageImage } from './Image';
import { objectRule } from './Object';
import { spoilerRule } from './Spoiler';
import { createRule } from './rules';

function isUrl(s: string) {
  let url;

  try {
    url = new URL(s);
  } catch (_) {
    return false;
  }

  return url.protocol === 'http:' || url.protocol === 'https:';
}

function isUrlImage(url: string): boolean {
  return url.match(/\.(jpeg|jpg|gif|png)$/) !== null;
}

const Pre = styled.div`
  pre {
    margin: 0;
    text-wrap: wrap;
  }
  padding: 16px;
  margin: 0;
  background-color: var(--N1000);
  color: var(--N300);
  border-radius: 4px;
  max-width: 800px;

  .hljs-comment {
    color: var(--N400);
  }
  .hljs-string {
    color: var(--G700);
  }
  .hljs-keyword {
    color: var(--V400);
  }
  .hljs-title.class_ {
    color: var(--Y600);
  }
  .hljs-title {
    color: var(--B500);
  }

  & > div {
    padding: 0 !important;
  }
`;

const Table = styled.table`
  border-collapse: collapse;
  &,
  th,
  td {
    border: 1px solid var(--N600);
    padding: 8px 12px;
  }
`;

const Mention = styled.span`
  background-color: #7591ff80;
  border-radius: 4px;
  padding: 0 2px;
`;

const mentionRule = createRule({
  order: SimpleMarkdown.defaultRules.em.order + 1,
  match(source: string) {
    return /^@(\w+)/.exec(source);
  },

  parse(capture: string[]) {
    return {
      content: capture[1],
    };
  },

  react(node, _, state) {
    return <Mention key={state.key}>@{node.content}</Mention>;
  },
});

const rules = {
  ...SimpleMarkdown.defaultRules,
  image: {
    ...SimpleMarkdown.defaultRules.image,
    react: (node: any, _: any, state: any) => (
      <MessageImage src={node.target} alt={node.alt} key={state.key} />
    ),
  },
  codeBlock: {
    ...SimpleMarkdown.defaultRules.codeBlock,
    react(node: any, _: any, state: any) {
      return (
        <Pre key={state.key}>
          <Highlight className={node.lang}>{node.content}</Highlight>
        </Pre>
      );
    },
  },

  paragraph: {
    ...SimpleMarkdown.defaultRules.paragraph,
    match: SimpleMarkdown.blockRegex(/^((?:[^\n])+)(?:\n *)+/),
  },

  link: {
    ...SimpleMarkdown.defaultRules.link,
    react(node: any, output: any, state: any) {
      return (
        <Anchor
          key={state.key}
          href={SimpleMarkdown.sanitizeUrl(node.target) ?? '#'}
          target="_blank"
        >
          {output(node.content, state)}
        </Anchor>
      );
    },
  },

  object: objectRule,
  emoji: emojiRule,
  spoiler: spoilerRule,
  mention: mentionRule,
};

const rawBuiltParser = SimpleMarkdown.parserFor(rules as any);
function parse(source: string) {
  const blockSource = `${source}\n\n`;
  return rawBuiltParser(blockSource, { inline: false });
}
const reactOutput = SimpleMarkdown.outputFor(rules, 'react');

const emojiSizing = css<{ emojiSize: string }>`
  .emoji-mart-emoji img {
    max-width: ${(p) => p.emojiSize} !important;
    max-height: ${(p) => p.emojiSize} !important;
  }
`;

const MarkdownWrapper = styled.div<{ emojiSize: string }>`
  gap: 8px;
  display: flex;
  flex-direction: column;
  ${emojiSizing}
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

export function Markdown({ content }: { content: string }) {
  const co =
    isUrl(content) && isUrlImage(content)
      ? `![Image Embed](${content})`
      : content;

  const parsed = parse(co);
  const output = reactOutput(parsed);

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <MarkdownWrapper emojiSize={emojiFest(parsed)}>{output}</MarkdownWrapper>
  );
}
