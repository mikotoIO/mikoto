import { Box } from '@chakra-ui/react';
import styled from '@emotion/styled';
import { faHashtag } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { MikotoChannel } from '@mikoto-io/mikoto.js';
import { Command } from 'cmdk';
import { atom, useAtom, useSetAtom } from 'jotai';
import { useEffect, useMemo } from 'react';
import { useSnapshot } from 'valtio/react';

import { useMikoto } from '@/hooks';
import { treebarSpaceState } from '@/store';
import { useTabkit } from '@/store/surface';

import { channelToTab } from './surfaces/Explorer/channelToTab';

export const commandMenuOpenAtom = atom(false);

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

  &:focus {
    outline: none;
  }
`;

const StyledItem = styled(Command.Item)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;

  &[data-selected='true'] {
    background-color: var(--chakra-colors-gray-800);
  }

  &:hover {
    background-color: var(--chakra-colors-gray-700);
  }
`;

const StyledGroup = styled(Command.Group)`
  [cmdk-group-heading] {
    font-size: 12px;
    color: var(--chakra-colors-gray-400);
    padding: 8px 12px 4px;
    text-transform: uppercase;
  }
`;

const StyledList = styled(Command.List)`
  max-height: 320px;
  overflow-y: auto;
`;

const SpaceIcon = styled.div<{ icon?: string }>`
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background-color: var(--chakra-colors-gray-600);
  background-image: ${(props) => (props.icon ? `url(${props.icon})` : 'none')};
  background-size: cover;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
`;

export function CommandMenuKit() {
  const [open, setOpen] = useAtom(commandMenuOpenAtom);
  const mikoto = useMikoto();
  const setLeftSidebar = useSetAtom(treebarSpaceState);
  const tabkit = useTabkit();

  // Subscribe to spaces for reactivity
  useSnapshot(mikoto.spaces);

  // Get all spaces
  const spaces = useMemo(() => {
    const spaceList = Array.from(mikoto.spaces.cache.values());
    return spaceList.filter((space) => space.type === 'NONE');
  }, [mikoto.spaces.cache.size]);

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const navigateToSpace = (spaceId: string) => {
    setLeftSidebar({
      kind: 'explorer',
      key: `explorer/${spaceId}`,
      spaceId,
    });
    setOpen(false);
  };

  const openChannel = (spaceId: string, channel: MikotoChannel) => {
    // Navigate to the space
    setLeftSidebar({
      kind: 'explorer',
      key: `explorer/${spaceId}`,
      spaceId,
    });
    // Open the channel as a tab
    const tab = channelToTab(channel);
    tabkit.openTab(tab, tabkit.getTabs().length > 0);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen} label="Global Command Menu">
      <Box bg="surface" rounded="md" maxW="60%" w="600px" maxH="400px">
        <Input placeholder="Search spaces and channels..." />
        <Box p={2}>
          <StyledList>
            <Command.Empty>No matching results</Command.Empty>

            <StyledGroup heading="Spaces">
              {spaces.map((space) => (
                <StyledItem
                  key={space.id}
                  value={`space ${space.name}`}
                  onSelect={() => navigateToSpace(space.id)}
                >
                  <SpaceIcon>
                    {space.icon === null ? space.name[0] : ''}
                  </SpaceIcon>
                  {space.name}
                </StyledItem>
              ))}
            </StyledGroup>

            {spaces.map((space) => {
              const channels = space.channels;
              if (channels.length === 0) return null;

              return (
                <StyledGroup key={space.id} heading={`${space.name} Channels`}>
                  {channels.map((channel) => (
                    <StyledItem
                      key={channel.id}
                      value={`channel ${space.name} ${channel.name}`}
                      onSelect={() => openChannel(space.id, channel)}
                    >
                      <FontAwesomeIcon
                        icon={faHashtag}
                        style={{ opacity: 0.6, marginLeft: 4 }}
                      />
                      <span>
                        {channel.name}
                        <span style={{ opacity: 0.5, marginLeft: 8 }}>
                          in {space.name}
                        </span>
                      </span>
                    </StyledItem>
                  ))}
                </StyledGroup>
              );
            })}
          </StyledList>
        </Box>
      </Box>
    </Dialog>
  );
}
