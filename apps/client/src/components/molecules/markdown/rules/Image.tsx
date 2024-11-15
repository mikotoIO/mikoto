import { Box, Link } from '@chakra-ui/react';
import styled from '@emotion/styled';
import SimpleMarkdown from '@khanacademy/simple-markdown';
import { useSetRecoilState } from 'recoil';

import { modalState } from '@/components/ContextMenu';
import { DialogContent } from '@/components/ui';

import { createRule } from '../rules';

interface MessageImageProps {
  src?: string;
  alt?: string;
}

const StyledMessageImage = styled.img`
  width: 100%;
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

export const imageRule = createRule({
  ...SimpleMarkdown.defaultRules.image,
  react: (node: any, _: any, state: any) => (
    <MessageImage src={node.target} alt={node.alt} key={state.key} />
  ),
});
