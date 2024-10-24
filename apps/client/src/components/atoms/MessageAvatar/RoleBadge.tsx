import { Circle, chakra } from '@chakra-ui/react';
import { Role } from '@mikoto-io/mikoto.js';

export const BaseRoleBadge = chakra('div', {
  baseStyle: {
    display: 'inline-block',
    px: 2,
    py: 1,
    border: '1px solid',
    borderColor: 'text',
    bgColor: 'gray.700',
    color: 'text',
    borderRadius: '4px',
    m: 1,
    fontSize: '12px',
  },
});

export function RoleBadge({ role }: { role: Role }) {
  return (
    <BaseRoleBadge borderColor={role.color ?? undefined}>
      <Circle
        display="inline-block"
        mr={1}
        size="10px"
        className="circle"
        bg={role.color ?? 'text'}
      />
      {role.name}
    </BaseRoleBadge>
  );
}
