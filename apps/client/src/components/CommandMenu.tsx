import { Box, Input, Modal } from '@mikoto-io/lucid';
import { useEffect } from 'react';
import { useSetRecoilState } from 'recoil';
import styled from 'styled-components';

import { modalState } from './ContextMenu';

const CommandInput = styled.input`
  background-color: var(--N900);
  color: white;
  border: none;
  outline: none;
  padding: 8px;
  border-radius: 4px;
`;

export function CommandMenuKit() {
  const setModal = useSetRecoilState(modalState);
  useEffect(() => {
    const fn = (ev: KeyboardEvent) => {
      if (!ev.ctrlKey) return;
      if (ev.key !== 'p') return;
      ev.preventDefault();

      setModal({
        elem: (
          <Modal
            noBackdrop
            style={{
              backgroundColor: 'var(--N800)',
              top: '80px',
            }}
          >
            <Box w={600}>
              <Input />
            </Box>
          </Modal>
        ),
      });
    };
    document.addEventListener('keydown', fn);
    return () => {
      document.removeEventListener('keydown', fn);
    };
  });

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <></>;
}
