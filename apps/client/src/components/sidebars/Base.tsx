import { Resizable } from 're-resizable';
import styled from 'styled-components';

export const StyledSidebar = styled(Resizable)`
  height: 100%;
`;

interface SidebarProps {
  position: 'left' | 'right';
  children: React.ReactNode;
}

export function Sidebar({ children, position }: SidebarProps) {
  return (
    <StyledSidebar
      enable={{ right: position === 'left', left: position === 'right' }}
      minWidth={200}
      maxWidth="50vw"
      maxHeight="100%"
      defaultSize={{ width: 240, height: '100%' }}
    >
      {children}
    </StyledSidebar>
  );
}
