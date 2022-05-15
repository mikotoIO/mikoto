import styled from 'styled-components';
import { AuthRefresher } from '../components/AuthHandler';

const SettingsContainer = styled.div`
  height: 100vh;
`;

const Sidebar = styled.div``;

export function SettingsView() {
  return (
    <AuthRefresher>
      <SettingsContainer>
        <Sidebar />
        <div>everything else lol</div>
      </SettingsContainer>
    </AuthRefresher>
  );
}
