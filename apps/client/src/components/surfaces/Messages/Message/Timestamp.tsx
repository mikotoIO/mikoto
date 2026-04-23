import { Box, type BoxProps } from '@chakra-ui/react';

function padTime(n: number): string {
  return String(n).padStart(2, '0');
}

export const DATE_FORMAT = new Intl.DateTimeFormat('en', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function dateFormat(date: Date): string {
  if (isToday(date)) {
    return `${padTime(date.getHours())}:${padTime(date.getMinutes())}`;
  }
  return `${DATE_FORMAT.format(date)} ${padTime(date.getHours())}:${padTime(date.getMinutes())}`;
}

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
      {dateFormat(time)}
    </Box>
  );
}
