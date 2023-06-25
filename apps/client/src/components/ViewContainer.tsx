import styled from 'styled-components';

export const ViewContainer = styled.div<{ padded?: boolean; scroll?: boolean }>`
  flex: 1;
  background-color: ${(p) => p.theme.colors.N800};
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: ${(p) => (p.padded ? '32px' : '0')};
  overflow-y: ${(p) => (p.scroll ? 'scroll' : 'hidden')};
`;

export const ScrollingViewContainer = styled.div`
  flex: 1;
  background-color: ${(p) => p.theme.colors.N800};
  padding: 8px 32px;
  overflow-y: scroll;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

export const ViewContainerWithSidebar = styled.div`
  background-color: ${(p) => p.theme.colors.N800};
  display: flex;
  height: 100%;
  overflow-y: scroll;
`;

export const SidebarContainerArea = styled.div`
  padding: 32px;
  height: 100%;
  box-sizing: border-box;
`;
