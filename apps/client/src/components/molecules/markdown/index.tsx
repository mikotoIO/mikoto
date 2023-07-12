import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Modal } from '@mantine/core';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { SpecialComponents } from 'react-markdown/lib/ast-to-react';
import { NormalComponents } from 'react-markdown/lib/complex-types';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import styled from 'styled-components';

import { remarkEmoji } from '../../../functions/remarkEmoji';

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

const ImageModal = styled(Modal)`
  .mantine-Paper-root {
    background-color: transparent;
  }
`;

interface MessageImageProps {
  src?: string;
  alt?: string;
}

const ImageModalTitleLink = styled.a`
  color: #8b8b8b;
  transition-duration: 0.2s;

  &:hover {
    color: white;
    text-decoration: underline;
  }

  text-decoration: none;
  outline: none;
`;

const StyledMessageImage = styled.img`
  max-width: 100%;
`;

function MessageImage({ src, alt }: MessageImageProps) {
  const [opened, setOpened] = useState(false);

  return (
    <>
      <ImageModal
        opened={opened}
        onClose={() => setOpened(false)}
        centered
        withCloseButton={false}
        title={
          <ImageModalTitleLink href={src} target="_blank">
            Source
            <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
          </ImageModalTitleLink>
        }
      >
        <StyledMessageImage src={src} alt={alt} />
      </ImageModal>
      <img
        src={src}
        alt={alt}
        style={{ cursor: 'pointer' }}
        onClick={() => {
          setOpened(true);
        }}
      />
    </>
  );
}

const Pre = styled.pre`
  text-wrap: wrap;
  padding: 16px;
  margin: 0;
  background-color: var(--N1000);
  color: var(--N300);
  border-radius: 4px;

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
  .hljs-title.function_ {
    color: var(--B500);
  }

  & > div {
    padding: 0 !important;
  }
`;

const StyledEmoji = styled.img`
  display: inline-block;
  height: 1.5em;
  vertical-align: middle;
`;

function Emoji({ src }: { src: string }) {
  return <StyledEmoji src={src} />;
}

const markdownComponents: Partial<
  Omit<NormalComponents, keyof SpecialComponents> & SpecialComponents
> = {
  img({ src, alt, className }) {
    if (className === 'emoji') {
      return <Emoji src={src!} />;
    }
    return <MessageImage src={src} alt={alt} />;
  },
  pre: (props) => <Pre {...props} />,
};

export function Markdown({ content }: { content: string }) {
  const co =
    isUrl(content) && isUrlImage(content)
      ? `![Image Embed](${content})`
      : content;

  return (
    <ReactMarkdown
      components={markdownComponents}
      remarkPlugins={[remarkGfm, remarkBreaks, remarkMath, remarkEmoji]}
      rehypePlugins={[rehypeKatex, rehypeHighlight]}
    >
      {co}
    </ReactMarkdown>
  );
}
