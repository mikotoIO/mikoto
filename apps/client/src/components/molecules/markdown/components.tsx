import { Box, Link } from '@chakra-ui/react';
import styled from '@emotion/styled';
import { useSetAtom } from 'jotai';
import { Suspense, lazy, useState } from 'react';
import type { Components } from 'react-markdown';

import { modalState } from '@/components/ContextMenu';
import { DialogContent } from '@/components/ui';

import { highlightTheme } from './rules/CodeBlock/highlightTheme';

const CodeHighlight = lazy(() => import('./rules/CodeBlock/CodeHighlight'));
const EmojiElement = lazy(() => import('./EmojiElement'));

const StyledMessageImage = styled.img`
  width: 100%;
`;

const MImage = styled.img`
  border-radius: 4px;
  cursor: pointer;
`;

function MessageImage({ src, alt }: { src?: string; alt?: string }) {
  const setModal = useSetAtom(modalState);

  return (
    <MImage
      src={src}
      alt={alt}
      onClick={() => {
        setModal({
          elem: (
            <DialogContent p={0} width="480px" bg="transparent">
              <Box mb={2}>
                <Link href={src} target="_blank" color="gray.100">
                  Open in Browser
                </Link>
              </Box>
              <StyledMessageImage src={src} alt={alt} />
            </DialogContent>
          ),
        });
      }}
    />
  );
}

const MentionSpan = styled.span`
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

const CodeBlockWrapper = styled.div`
  pre {
    margin: 0;
    text-wrap: wrap;
  }
  padding: 16px;
  margin: 0;
  background-color: ${highlightTheme.hljs.background};
  color: ${highlightTheme.hljs.color};
  border-radius: 4px;
  max-width: 800px;

  & > div {
    padding: 0 !important;
  }
`;

export const markdownComponents: Partial<Components> = {
  a({ href, children }) {
    // Intercept autolinks with non-http schemes like <type:data>
    if (href && !/^https?:\/\//.test(href)) {
      const match = /^(\w+):(.*)$/.exec(href);
      if (match) {
        return <ObjectNotFound resource={match[1]} />;
      }
    }
    return (
      <Link href={href ?? '#'} target="_blank">
        {children}
      </Link>
    );
  },

  img({ src, alt }) {
    return <MessageImage src={src} alt={alt} />;
  },

  pre({ children }) {
    return <CodeBlockWrapper>{children}</CodeBlockWrapper>;
  },

  code({ className, children }) {
    const langMatch = className?.match(/language-(\S+)/);
    if (langMatch) {
      const language = langMatch[1];
      const content = String(children).replace(/\n$/, '');
      return (
        <Suspense
          fallback={
            <pre>
              <code>{content}</code>
            </pre>
          }
        >
          <CodeHighlight language={language} content={content} />
        </Suspense>
      );
    }
    return <code>{children}</code>;
  },

  // Custom elements mapped from remark plugins via data.hName
  // @ts-expect-error custom element
  mention({ username }: { username: string }) {
    return <MentionSpan>@{username}</MentionSpan>;
  },

  'emoji-shortcode'({ emoji }: { emoji: string }) {
    return (
      <Suspense>
        <EmojiElement emoji={emoji} />
      </Suspense>
    );
  },

  spoiler({ content }: { content: string }) {
    return <Spoiler>{content}</Spoiler>;
  },
};
