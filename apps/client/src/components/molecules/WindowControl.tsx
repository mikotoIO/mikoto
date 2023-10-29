import styled from 'styled-components';

import { maybeElectron } from '../../functions/maybeElectron';

const Button = styled.button``;

export function WindowControl() {
  if (maybeElectron === undefined) return null;

  return (
    <div>
      <Button
        onClick={() => maybeElectron?.ipcRenderer.send('window:minimize')}
      >
        -
      </Button>
    </div>
  );
}
