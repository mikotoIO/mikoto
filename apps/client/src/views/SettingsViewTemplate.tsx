import styled from 'styled-components';

export const SettingsSidebar = styled.div`
  background-color: ${(p) => p.theme.colors.N900};
`;

export const SettingsView = styled.div`
  box-sizing: border-box;
  flex: 1;
  background-color: ${(p) => p.theme.colors.N800};
  padding: 8px 32px;
  overflow-y: scroll;
  height: 100%;
  display: flex;
  flex-direction: column;
`;
