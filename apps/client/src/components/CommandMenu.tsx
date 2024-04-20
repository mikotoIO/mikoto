import { Box, ModalContent } from '@chakra-ui/react';
import styled from '@emotion/styled';
import { useEffect } from 'react';
import { useSetRecoilState } from 'recoil';

import { modalState } from '@/components/ContextMenu';

const CommandInput = styled.input`
  background-color: var(--chakra-colors-gray-800);
  color: white;
  border: none;
  outline: none;
  padding: 8px;
  border-radius: 4px;
  width: 100%;
  box-sizing: border-box;
`;

function CommandMenu() {
  const setModal = useSetRecoilState(modalState);

  return (
    <ModalContent rounded="md" p={4} maxW="480px">
      <Box>
        <CommandInput
          placeholder="> Type your command"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              console.log('Run command');
              setModal(null);
            }
          }}
        />
      </Box>
    </ModalContent>
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
