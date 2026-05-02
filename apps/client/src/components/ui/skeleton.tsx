import type {
  SkeletonProps as ChakraSkeletonProps,
  CircleProps,
} from '@chakra-ui/react';
import { Skeleton as ChakraSkeleton, Circle } from '@chakra-ui/react';
import 'react';

export interface SkeletonCircleProps extends ChakraSkeletonProps {
  size?: CircleProps['size'];
}

export const SkeletonCircle = (props: SkeletonCircleProps) => {
  const { size, ...rest } = props;
  return (
    <Circle size={size} asChild>
      <ChakraSkeleton {...rest} />
    </Circle>
  );
};

export const Skeleton = ChakraSkeleton;
