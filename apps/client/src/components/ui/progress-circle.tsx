import type { SystemStyleObject } from '@chakra-ui/react';
import {
  AbsoluteCenter,
  ProgressCircle as ChakraProgressCircle,
} from '@chakra-ui/react';
import 'react';

export const ProgressCircleRoot = ChakraProgressCircle.Root;

interface ProgressCircleRingProps extends ChakraProgressCircle.CircleProps {
  trackColor?: SystemStyleObject['stroke'];
  cap?: SystemStyleObject['strokeLinecap'];
}

export const ProgressCircleRing = function ProgressCircleRing(props: ProgressCircleRingProps, ref) {
  const { trackColor, cap, color, ...rest } = props;
  return (
    <ChakraProgressCircle.Circle {...rest} ref={ref}>
      <ChakraProgressCircle.Track stroke={trackColor} />
      <ChakraProgressCircle.Range stroke={color} strokeLinecap={cap} />
    </ChakraProgressCircle.Circle>
  );
};

export const ProgressCircleValueText = function ProgressCircleValueText(props: ChakraProgressCircle.ValueTextProps, ref) {
  return (
    <AbsoluteCenter>
      <ChakraProgressCircle.ValueText {...props} ref={ref} />
    </AbsoluteCenter>
  );
};
