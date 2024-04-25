import { Box } from '@chakra-ui/react';

function padTime(n: number): string {
  return String(n).padStart(2, '0');
}

const dateFormat = new Intl.DateTimeFormat('en', {
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

export function Timestamp({ time }: { time: Date }) {
  return (
    <Box color="gray.400" fontSize="xs">
      {isToday(time) ? 'Today at ' : dateFormat.format(time)}{' '}
      {padTime(time.getHours())}:{padTime(time.getMinutes())}
    </Box>
  );
}
