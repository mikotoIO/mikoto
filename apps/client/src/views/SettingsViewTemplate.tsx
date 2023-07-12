import styled from 'styled-components';

const SettingsViewBase = styled.div`
  box-sizing: border-box;
  flex: 1;
  background-color: ${(p) => p.theme.colors.N800};
  padding: 8px 32px;
  overflow-y: scroll;
  height: 100%;
  flex-direction: column;
  display: flex;
`;

const Sidebar = styled.div`
  padding: 16px;
`;

const Container = styled.div`
  height: 100%;
  background-color: var(--N800);
  display: grid;
  grid-template-columns: 200px 1fr;
`;

const Nav = styled.a<{ active?: boolean }>`
  display: block;
  cursor: pointer;
  font-size: 14px;
  padding: 8px 16px;
  border-radius: 4px;
  background-color: ${(p) => (p.active ? `var(--N600)` : 'transparent')};
  color: var(--N0);
  user-select: none;
`;

export const SettingsView = Object.assign(SettingsViewBase, {
  Container,
  Sidebar,
  Nav,
});
