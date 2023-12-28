import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faHashtag } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';

const StyledIcon = styled.span<{ size?: number }>`
  background-color: var(--color-primary);
  color: white;
  border-radius: 3px;
  text-align: center;
  width: ${(p) => p.size ?? 24}px;
  height: ${(p) => p.size ?? 24}px;
  align-items: center;
  justify-content: center;
`;

interface TabIconProps {
  size?: number;
  icon?: IconDefinition;
}

export function IconBox({ size, icon }: TabIconProps) {
  return (
    <StyledIcon size={size}>
      <FontAwesomeIcon icon={icon ?? faHashtag} />
    </StyledIcon>
  );
}
