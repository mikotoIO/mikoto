const TIME_FORMAT = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
});

const DATE_FORMAT = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const FULL_FORMAT = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'full',
  timeStyle: 'short',
});

function sameDay(a: Date, b: Date) {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

function dateFormat(date: Date): string {
  const now = new Date();
  if (sameDay(date, now)) return TIME_FORMAT.format(date);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(date, yesterday)) {
    return `Yesterday at ${TIME_FORMAT.format(date)}`;
  }
  return `${DATE_FORMAT.format(date)}, ${TIME_FORMAT.format(date)}`;
}

/**
 * A message time. `timeOnly` is for the hover gutter of continuation rows,
 * where the date is already given by the group above.
 */
export function Timestamp({
  time,
  timeOnly,
  className,
}: {
  time: Date;
  timeOnly?: boolean;
  className?: string;
}) {
  if (Number.isNaN(time.getTime())) return null;
  return (
    <time
      className={className}
      dateTime={time.toISOString()}
      title={FULL_FORMAT.format(time)}
    >
      {timeOnly ? TIME_FORMAT.format(time) : dateFormat(time)}
    </time>
  );
}
