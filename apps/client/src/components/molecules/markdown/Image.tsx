import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Modal } from '@mantine/core';
import { useState } from 'react';
import styled from 'styled-components';

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

export function MessageImage({ src, alt }: MessageImageProps) {
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
