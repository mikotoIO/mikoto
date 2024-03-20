import { Box, Link } from '@chakra-ui/react';
import SimpleMarkdown from '@khanacademy/simple-markdown';
import { Modal } from '@mikoto-io/lucid';
import { useSetRecoilState } from 'recoil';
import styled from 'styled-components';

import { modalState } from '../../../ContextMenu';
import { createRule } from '../rules';

interface MessageImageProps {
  src?: string;
  alt?: string;
}

const StyledMessageImage = styled.img`
  max-width: 50vw;
  max-height: 75vh;
`;

const MImage = styled.img`
  border-radius: 4px;
  cursor: pointer;
`;

export function MessageImage({ src, alt }: MessageImageProps) {
  const setModal = useSetRecoilState(modalState);

  return (
    <MImage
      src={src}
      alt={alt}
      onClick={() => {
        setModal({
          elem: (
            <Modal style={{ padding: 0, background: 'none' }}>
              <Box mb={2}>
                <Link href={src} target="_blank" color="gray.100">
                  Open in Browser
                </Link>
              </Box>
              <StyledMessageImage src={src} alt={alt} />
            </Modal>
          ),
        });
      }}
    />
  );
}

export const imageRule = createRule({
  ...SimpleMarkdown.defaultRules.image,
  react: (node: any, _: any, state: any) => (
    <MessageImage src={node.target} alt={node.alt} key={state.key} />
  ),
});
