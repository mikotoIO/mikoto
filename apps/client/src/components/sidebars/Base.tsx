import { Resizable, NumberSize } from 're-resizable';
import styled from 'styled-components';

export const StyledSidebar = styled(Resizable)`
  height: 100%;
`;

interface SidebarProps {
  position: 'left' | 'right';
  size: number;
  children: React.ReactNode;
  onResize?: (size: NumberSize) => void;
}

export function Sidebar({ children, position, size, onResize }: SidebarProps) {
  return (
    <StyledSidebar
      enable={{ right: position === 'left', left: position === 'right' }}
      minWidth={200}
      maxWidth="50vw"
      maxHeight="100%"
      size={{ width: size, height: '100%' }}
      onResizeStop={(_, _1, _2, d) => {
        onResize?.(d);
      }}
    >
      {children}
    </StyledSidebar>
  );
}
