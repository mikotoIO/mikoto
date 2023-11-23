import { NumberSize, Resizable } from 're-resizable';

interface SidebarProps {
  position: 'left' | 'right';
  size: number;
  children: React.ReactNode;
  onResize?: (size: NumberSize) => void;
}

export function Sidebar({ children, position, size, onResize }: SidebarProps) {
  return (
    <Resizable
      enable={{
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
    >
      {children}
    </Resizable>
  );
}
