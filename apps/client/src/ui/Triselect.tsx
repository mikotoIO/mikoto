import styled from '@emotion/styled';
import { faCheck, faMinus, faX } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';

const StyledTriselector = styled.div`
  background-color: var(--chakra-colors-gray-850);
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
    background-color: var(--chakra-colors-gray-600);
  }

  &.positive {
    background-color: var(--chakra-colors-green-500);
  }
  &.neutral {
    background-color: var(--chakra-colors-gray-500);
  }
  &.negative {
    background-color: var(--chakra-colors-red-500);
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
