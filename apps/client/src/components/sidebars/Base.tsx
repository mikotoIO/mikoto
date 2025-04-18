import { Box } from '@chakra-ui/react';
import { NumberSize, Resizable } from 're-resizable';

interface SidebarProps {
  position: 'left' | 'right';
  size: number;
  children: React.ReactNode;
  onResize?: (size: NumberSize) => void;
}

export const RESIZABLE_DISABLES = {
  top: false,
  right: false,
  bottom: false,
  left: false,
  topRight: false,
  bottomRight: false,
  bottomLeft: false,
  topLeft: false,
};

export function Sidebar({ children, position, size, onResize }: SidebarProps) {
  return (
    <Resizable
      enable={{
        ...RESIZABLE_DISABLES,
        right: position === 'left',
        left: position === 'right',
      }}
      minWidth={200}
      maxWidth="50vw"
      maxHeight="100%"
      size={{ width: size, height: '100%' }}
      onResizeStop={(_, _1, _2, d) => {
        onResize?.(d);
      }}
      style={{ flexShrink: 0 }}
    >
      <Box
        className="sidebar"
        height="100%"
        overflowY="auto"
        borderX="1px solid"
        borderColor="gray.650"
        width="100%"
      >
        {children}
      </Box>
    </Resizable>
  );
}
