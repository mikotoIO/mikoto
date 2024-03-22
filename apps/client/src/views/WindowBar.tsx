import { chakra } from '@chakra-ui/react';
import { faClose, faExpand, faMinus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from '@emotion/styled';

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

const StyledWindowButtons = chakra('div', {
  baseStyle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
});

const StyledWindowButton = styled.div<{ color: string }>`
  -webkit-app-region: no-drag;
  color: var(--chakra-colors-gray-400);
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
            color="var(--chakra-colors-gray-600)"
            onClick={() => {
              (window as any).electronAPI.minimize();
            }}
          >
            <FontAwesomeIcon icon={faMinus} />
          </StyledWindowButton>
          <StyledWindowButton color="var(--chakra-colors-gray-600)">
            <FontAwesomeIcon icon={faExpand} />
          </StyledWindowButton>
          <StyledWindowButton color="var(--chakra-colors-red-500)">
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
