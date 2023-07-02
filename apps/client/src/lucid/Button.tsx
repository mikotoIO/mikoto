import styled from 'styled-components';

export const Buttons = styled.div`
  display: flex;
  gap: 8px;
`;

const variantMap = {
  default: {
    backgroundColor: 'var(--N500)',
    color: 'var(--N0)',
  },
  primary: {
    backgroundColor: 'var(--B700)',
    color: 'var(--N0)',
  },
};

export const Button = styled.button<{ variant?: keyof typeof variantMap }>`
  background-color: ${(p) => variantMap[p.variant!].backgroundColor};

  color: ${(p) => variantMap[p.variant!].color};
  font-weight: bolder;

  border: none;
  padding: 12px 20px;
  border-radius: 4px;
  font-size: 14px;

  &:hover {
    box-shadow: inset 0 0 100px 100px rgba(255, 255, 255, 0.1);
  }
  transition: box-shadow 0.1s ease-in-out;
  cursor: pointer;
`;

Button.defaultProps = { variant: 'default' };
