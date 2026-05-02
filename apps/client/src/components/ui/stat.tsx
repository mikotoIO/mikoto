import {
  Badge,
  type BadgeProps,
  Stat as ChakraStat,
  FormatNumber,
  IconButton,
} from '@chakra-ui/react';
import 'react';
import { HiOutlineInformationCircle } from 'react-icons/hi';

import { ToggleTip } from './toggle-tip';

interface StatLabelProps extends ChakraStat.LabelProps {
  info?: React.ReactNode;
}

export const StatLabel = function StatLabel(props: StatLabelProps) {
  const { info, children, ...rest } = props;
  return (
    <ChakraStat.Label {...rest}>
      {children}
      {info && (
        <ToggleTip content={info}>
          <IconButton variant="ghost" aria-label="info" size="2xs">
            <HiOutlineInformationCircle />
          </IconButton>
        </ToggleTip>
      )}
    </ChakraStat.Label>
  );
};

interface StatValueTextProps extends ChakraStat.ValueTextProps {
  value?: number;
  formatOptions?: Intl.NumberFormatOptions;
}

export const StatValueText = function StatValueText(props: StatValueTextProps) {
  const { value, formatOptions, children, ...rest } = props;
  return (
    <ChakraStat.ValueText {...rest}>
      {children ||
        (value != null && <FormatNumber value={value} {...formatOptions} />)}
    </ChakraStat.ValueText>
  );
};

export const StatUpTrend = function StatUpTrend(props: BadgeProps) {
  return (
    <Badge colorPalette="green" gap="0" {...props}>
      <ChakraStat.UpIndicator />
      {props.children}
    </Badge>
  );
};

export const StatDownTrend = function StatDownTrend(props: BadgeProps) {
  return (
    <Badge colorPalette="red" gap="0" {...props}>
      <ChakraStat.DownIndicator />
      {props.children}
    </Badge>
  );
};

export const StatRoot = ChakraStat.Root;
export const StatHelpText = ChakraStat.HelpText;
export const StatValueUnit = ChakraStat.ValueUnit;
