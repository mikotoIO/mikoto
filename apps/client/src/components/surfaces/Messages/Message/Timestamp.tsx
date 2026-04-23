import { Box, type BoxProps } from '@chakra-ui/react';

function padTime(n: number): string {
  return String(n).padStart(2, '0');
}

export const MIKOTO_DATE_FORMAT = new Intl.DateTimeFormat('en', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function isToday(someDate: Date): boolean {
  const today = new Date();
  return (
    someDate.getDate() === today.getDate() &&
    someDate.getMonth() === today.getMonth() &&
    someDate.getFullYear() === today.getFullYear()
  );
}

export function Timestamp({ time, ...rest }: { time: Date } & BoxProps) {
  return (
    <Box color="gray.400" fontSize="xs" {...rest}>
      {isToday(time) ? 'Today at ' : MIKOTO_DATE_FORMAT.format(time)}{' '}
      {padTime(time.getHours())}:{padTime(time.getMinutes())}
    </Box>
  );
}
