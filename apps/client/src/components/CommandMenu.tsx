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

function CommandMenu() {
  const setModal = useSetRecoilState(modalState);

  return (
    <Modal
      noBackdrop
      style={{
        backgroundColor: 'var(--N800)',
        top: '80px',
      }}
    >
      <Box w={600}>
        <Input
          placeholder="> Type your command"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              console.log('Run command');
              setModal(null);
            }
          }}
        />
      </Box>
    </Modal>
  );
}

export function CommandMenuKit() {
  const setModal = useSetRecoilState(modalState);
  useEffect(() => {
    const fn = (ev: KeyboardEvent) => {
      if (!(ev.ctrlKey && ev.key === 'p')) return;
      ev.preventDefault();

      setModal({
        elem: <CommandMenu />,
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
