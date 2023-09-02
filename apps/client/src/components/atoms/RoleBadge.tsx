import { Role } from 'mikotojs';
import styled from 'styled-components';

const StyledRoleBadge = styled.div<{ color?: string }>`
  display: inline-block;
  padding: 4px 8px;
  border: 1px solid ${(p) => p.color ?? 'var(--N0)'};
  background-color: var(--N800);
  color: var(--N0);
  border-radius: 4px;
  white-space: nowrap;
  margin: 4px;

  font-size: 12px;

  .circle {
    display: inline-block;
    height: 10px;
    width: 10px;
    margin-right: 4px;
    border-radius: 50%;
    background-color: ${(p) => p.color ?? 'var(--N0)'};
  }
`;

export function RoleBadge({ role }: { role: Role }) {
  return (
    <StyledRoleBadge color={role.color ?? undefined}>
      <span className="circle" />
      {role.name}
    </StyledRoleBadge>
  );
}
