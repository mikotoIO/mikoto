import { Flex } from '@chakra-ui/react';
import React from 'react';

interface SpaceIconProps {
  icon?: string;
  size?: string;
  color?: string;
  fontSize?: string;
}

export function StyledSpaceIcon({
  icon,
  size,
  color,
  fontSize,
  ...rest
}: SpaceIconProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Flex
      w={size ?? '48px'}
      h={size ?? '48px'}
      align="center"
      justify="center"
      borderRadius={8}
      bg="surface"
      bgImage={icon ? `url(${icon})` : 'none'}
      bgSize="cover"
      cursor="pointer"
      color={color}
      fontSize={fontSize ?? '14px'}
      {...rest}
    />
  );
}
