import React from 'react';
import styled, { StyledComponentProps } from 'styled-components';

const AvatarImg = styled.img`
  margin-top: 4px;
  width: 40px;
  height: 40px;
  border-radius: 8px;
`;

type AvatarProps = StyledComponentProps<'img', any, {}, never>;

export function Avatar({ src, ...rest }: AvatarProps) {
  return <AvatarImg src={src ?? '/images/default_avatar.png'} {...rest} />;
}
