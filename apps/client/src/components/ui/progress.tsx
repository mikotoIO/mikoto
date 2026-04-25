import { Progress as ChakraProgress, IconButton } from '@chakra-ui/react';
import 'react';
import { HiOutlineInformationCircle } from 'react-icons/hi';

import { ToggleTip } from './toggle-tip';

export const ProgressBar = function ProgressBar(props: ChakraProgress.TrackProps, ref) {
  return (
    <ChakraProgress.Track {...props} ref={ref}>
      <ChakraProgress.Range />
    </ChakraProgress.Track>
  );
};

export const ProgressRoot = ChakraProgress.Root;
export const ProgressValueText = ChakraProgress.ValueText;

export interface ProgressLabelProps extends ChakraProgress.LabelProps {
  info?: React.ReactNode;
}

export const ProgressLabel = function ProgressLabel(props: ProgressLabelProps, ref) {
  const { children, info, ...rest } = props;
  return (
    <ChakraProgress.Label {...rest} ref={ref}>
      {children}
      {info && (
        <ToggleTip content={info}>
          <IconButton variant="ghost" aria-label="info" size="2xs" ms="1">
            <HiOutlineInformationCircle />
          </IconButton>
        </ToggleTip>
      )}
    </ChakraProgress.Label>
  );
};
