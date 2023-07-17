import styled from 'styled-components';

export const Avatar = styled.img<{ size?: number | string }>`
  user-select: none;
  width: ${(p) => (typeof p.size === 'number' ? `${p.size}px` : p.size)};
  height: ${(p) => (typeof p.size === 'number' ? `${p.size}px` : p.size)};
  border-radius: 8px;
`;

Avatar.defaultProps = {
  src: '/images/default_avatar.png',
  size: 40,
};
