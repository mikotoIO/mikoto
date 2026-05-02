'use client';

import type { GroupProps, SlotRecipeProps } from '@chakra-ui/react';
import { Avatar as ChakraAvatar, Group } from '@chakra-ui/react';
import 'react';

type ImageProps = React.ImgHTMLAttributes<HTMLImageElement>;

export interface AvatarProps extends ChakraAvatar.RootProps {
  name?: string;
  src?: string;
  srcSet?: string;
  loading?: ImageProps['loading'];
  icon?: React.ReactElement;
  fallback?: React.ReactNode;
}

export const Avatar = function Avatar(props: AvatarProps) {
  const { name, src, srcSet, loading, icon, fallback, children, ...rest } =
    props;
  return (
    <ChakraAvatar.Root {...rest}>
      <AvatarFallback name={name} icon={icon}>
        {fallback}
      </AvatarFallback>
      <ChakraAvatar.Image src={src} srcSet={srcSet} loading={loading} />
      {children}
    </ChakraAvatar.Root>
  );
};

interface AvatarFallbackProps extends ChakraAvatar.FallbackProps {
  name?: string;
  icon?: React.ReactElement;
}

const AvatarFallback = function AvatarFallback(props: AvatarFallbackProps) {
  const { name, icon, children, ...rest } = props;
  return (
    <ChakraAvatar.Fallback {...rest}>
      {children}
      {name != null && children == null && <>{getInitials(name)}</>}
      {name == null && children == null && (
        <ChakraAvatar.Icon asChild={!!icon}>{icon}</ChakraAvatar.Icon>
      )}
    </ChakraAvatar.Fallback>
  );
};

function getInitials(name: string) {
  const names = name.trim().split(' ');
  const firstName = names[0] != null ? names[0] : '';
  const lastName = names.length > 1 ? names[names.length - 1] : '';
  return firstName && lastName
    ? `${firstName.charAt(0)}${lastName.charAt(0)}`
    : firstName.charAt(0);
}

interface AvatarGroupProps extends GroupProps, SlotRecipeProps<'avatar'> {}

export const AvatarGroup = function AvatarGroup(props: AvatarGroupProps) {
  const { size, variant, borderless, ...rest } = props;
  return (
    <ChakraAvatar.PropsProvider value={{ size, variant, borderless }}>
      <Group gap="0" spaceX="-3" {...rest} />
    </ChakraAvatar.PropsProvider>
  );
};
