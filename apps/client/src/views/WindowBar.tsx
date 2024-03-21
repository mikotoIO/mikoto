import { faClose, faExpand, faMinus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';

const StyledWindowBar = styled.div`
  height: 36px;
  -webkit-app-region: drag;
  flex-grow: 1;
  display: flex;

  align-items: center;
  justify-content: end;
  padding: 0 8px;
  font-size: 16px;
`;

const StyledWindowButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StyledWindowButton = styled.div<{ color: string }>`
  -webkit-app-region: no-drag;
  color: var(--N400);
  width: 32px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  outline: none;
  cursor: pointer;
  &:hover {
    color: var(--chakra-colors-white);
    background-color: ${(p) => p.color};
  }
`;

const IS_ELECTRON = navigator.userAgent.indexOf('Electron') !== -1;

export function WindowBar() {
  return (
    <StyledWindowBar>
      {IS_ELECTRON && (
        <StyledWindowButtons>
          <StyledWindowButton
            color="var(--N700)"
            onClick={() => {
              (window as any).electronAPI.minimize();
            }}
          >
            <FontAwesomeIcon icon={faMinus} />
          </StyledWindowButton>
          <StyledWindowButton color="var(--N700)">
            <FontAwesomeIcon icon={faExpand} />
          </StyledWindowButton>
          <StyledWindowButton color="var(--R700)">
            <FontAwesomeIcon
              icon={faClose}
              onClick={() => {
                (window as any).electronAPI.close();
              }}
            />
          </StyledWindowButton>
        </StyledWindowButtons>
      )}
    </StyledWindowBar>
  );
}
