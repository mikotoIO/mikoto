import { Modal } from '@mikoto-io/lucid';
import { useRecoilState } from 'recoil';
import styled from 'styled-components';

import { modalState } from '../../ContextMenu';

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
  const [modal, setModal] = useRecoilState(modalState);

  return (
    <MImage
      src={src}
      alt={alt}
      onClick={() => {
        setModal({
          elem: (
            <Modal>
              <StyledMessageImage src={src} alt={alt} />
            </Modal>
          ),
        });
      }}
    />
  );
}
