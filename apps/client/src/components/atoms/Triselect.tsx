import { faCheck, faX, faMinus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import styled from 'styled-components';

const StyledTriselector = styled.div`
  background-color: var(--N1000);
  width: 120px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  height: 30px;
  border-radius: 4px;
  overflow: hidden;
`;

const TriselectorInner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:hover {
    background-color: var(--N700);
  }

  &.positive {
    background-color: var(--G700);
  }
  &.neutral {
    background-color: var(--N500);
  }
  &.negative {
    background-color: var(--R600);
  }
`;

type Triselection = 'positive' | 'neutral' | 'negative';

export function Triselector() {
  const [selection, setSelection] = useState<Triselection>('neutral');
  return (
    <StyledTriselector>
      <TriselectorInner
        className={selection === 'negative' ? 'negative' : ''}
        onClick={() => {
          setSelection('negative');
        }}
      >
        <FontAwesomeIcon icon={faX} />
      </TriselectorInner>
      <TriselectorInner
        className={selection === 'neutral' ? 'neutral' : ''}
        onClick={() => {
          setSelection('neutral');
        }}
      >
        <FontAwesomeIcon icon={faMinus} />
      </TriselectorInner>
      <TriselectorInner
        className={selection === 'positive' ? 'positive' : ''}
        onClick={() => {
          setSelection('positive');
        }}
      >
        <FontAwesomeIcon icon={faCheck} />
      </TriselectorInner>
    </StyledTriselector>
  );
}
