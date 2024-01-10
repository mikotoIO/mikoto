import SimpleMarkdown from '@khanacademy/simple-markdown';
import { Anchor, Box, Modal } from '@mikoto-io/lucid';
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
              <Box m={{ bottom: 8 }}>
                <Anchor href={src} target="_blank" txt="N200">
                  Open in Browser
                </Anchor>
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
