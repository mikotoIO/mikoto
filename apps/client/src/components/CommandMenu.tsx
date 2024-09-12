import { Box } from '@chakra-ui/react';
import styled from '@emotion/styled';
import { Command } from 'cmdk';
import { useEffect, useState } from 'react';

const Dialog = styled(Command.Dialog)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const Input = styled(Command.Input)`
  width: 100%;
  padding: 16px;
  font-size: 14px;
  border: none;
  border-radius: 4px;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  background-color: var(--chakra-colors-gray-750);
  font-family: var(--font-code);

  &:focus {
    outline: none;
  }
`;

export function CommandMenuKit() {
  const [open, setOpen] = useState(false);

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e: any) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen} label="Global Command Menu">
      <Box bg="surface" rounded="md" maxW="60%" w="600px" h="400px">
        <Input placeholder="> Search for commands..." />
        <Box p={4}>
          <Command.List>
            <Command.Empty>No matching results</Command.Empty>

            <Command.Group heading="Letters">
              <Command.Item>a</Command.Item>
              <Command.Item>b</Command.Item>
              <Command.Separator />
              <Command.Item>c</Command.Item>
            </Command.Group>

            <Command.Item>Apple</Command.Item>
          </Command.List>
        </Box>
      </Box>
    </Dialog>
  );
}
