import styled from 'styled-components';

export const ViewContainer = styled.div`
  flex: 1;
  background-color: ${(p) => p.theme.colors.N800};
  height: 100%;
  display: flex;
  flex-direction: column;
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
  display: grid;
  background-color: ${(p) => p.theme.colors.N800};
  grid-template-columns: 200px auto;
  height: 100%;
  flex-direction: column;
`;

export const SidebarContainerArea = styled.div`
  padding: 32px;
`;
