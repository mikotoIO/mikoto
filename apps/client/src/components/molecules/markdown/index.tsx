import { Box, Link } from '@chakra-ui/react';
import styled from '@emotion/styled';
import React, { Suspense, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { MessageImage } from './rules/Image';
import { CodeBlock, CodeHighlight } from './rules/CodeBlock';
import { remarkCustomSyntax } from './remarkCustomSyntax';

const EmojiElement = React.lazy(() => import('./EmojiElement'));

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

function isEmojiOnly(content: string): boolean {
  return /^(\s*:(?:\+1|[-\w]+):\s*)+$/.test(content.trim());
}

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

const Mention = styled.span`
  background-color: #7591ff80;
  border-radius: 4px;
  padding: 0 2px;
`;

function Spoiler({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = useState(true);
  return (
    <Box
      display="inline-block"
      backgroundColor={hidden ? 'gray.900' : 'gray.650'}
      color={hidden ? 'transparent' : 'text'}
      px={1}
      borderRadius="4px"
      cursor="pointer"
      onClick={() => {
        setHidden(!hidden);
      }}
    >
      {children}
    </Box>
  );
}

function ObjectNotFound({ resource }: { resource: string }) {
  return (
    <Box m={1} p={4} bg="gray.800" rounded="md" maxW="300px">
      Object not found: {resource}
    </Box>
  );
}

const remarkPlugins = [remarkGfm, remarkCustomSyntax];

const components: Record<string, React.ComponentType<any>> = {
  mention: ({ username }: { username: string }) => (
    <Mention>@{username}</Mention>
  ),
  emoji: ({ id }: { id: string }) => (
    <Suspense>
      <EmojiElement emoji={id} />
    </Suspense>
  ),
  spoiler: ({ children }: { children: React.ReactNode }) => (
    <Spoiler>{children}</Spoiler>
  ),
  'object-embed': ({ resource }: { resource: string }) => (
    <ObjectNotFound resource={resource} />
  ),
  a: ({
    href,
    children,
  }: {
    href?: string;
    children: React.ReactNode;
  }) => (
    <Link href={href ?? '#'} target="_blank">
      {children}
    </Link>
  ),
  img: ({ src, alt }: { src?: string; alt?: string }) => (
    <MessageImage src={src} alt={alt} />
  ),
  code: ({
    inline,
    className,
    children,
  }: {
    inline?: boolean;
    className?: string;
    children: React.ReactNode;
  }) => {
    if (inline) {
      return <code>{children}</code>;
    }

    const langMatch = className?.match(/language-(\S+)/);
    const lang = langMatch?.[1];
    const content = String(children).replace(/\n$/, '');

    return (
      <CodeBlock>
        {lang === undefined ? (
          <pre>
            <code>{content}</code>
          </pre>
        ) : (
          <Suspense
            fallback={
              <pre>
                <code>{content}</code>
              </pre>
            }
          >
            <CodeHighlight language={lang} content={content} />
          </Suspense>
        )}
      </CodeBlock>
    );
  },
  pre: ({ children }: { children: React.ReactNode }) => <>{children}</>,
};

export function Markdown({ content }: { content: string }) {
  const co =
    isUrl(content) && isUrlImage(content)
      ? `![Image Embed](${content})`
      : content;

  const emojiSize = isEmojiOnly(co) ? '3em' : '1.2em';

  return (
    <MarkdownWrapper emojiSize={emojiSize}>
      <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
        {co}
      </ReactMarkdown>
    </MarkdownWrapper>
  );
}
