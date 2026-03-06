import { Center, Heading, Text } from '@chakra-ui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useState } from 'react';

import { faMikoto } from '@/components/icons';
import { Tabable, useTabkit } from '@/store/surface';

export function WelcomePanel() {
  const tabkit = useTabkit();
  const [dragOver, setDragOver] = useState(false);

  const onDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('application/mikoto-tab')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOver(true);
    }
  }, []);

  const onDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const rawTab = e.dataTransfer.getData('application/mikoto-tab');
      if (!rawTab) return;
      const tab: Tabable = JSON.parse(rawTab);
      tabkit.openTab(tab, true);
    },
    [tabkit],
  );

  return (
    <Center
      w="100%"
      h="100%"
      flexDir="column"
      className="empty-view"
      bg="surface"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      position="relative"
      overflow="hidden"
    >
      {dragOver && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'hsla(230, 16%, 27%, 0.5)',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />
      )}
      <FontAwesomeIcon icon={faMikoto} fontSize="10vw" />
      <Heading mb="4px">Welcome to Mikoto</Heading>
      <Text color="gray.400" fontSize="14px">
        {dragOver
          ? 'Drop to open channel'
          : 'Open a channel from the sidebar to get started'}
      </Text>
    </Center>
  );
}
