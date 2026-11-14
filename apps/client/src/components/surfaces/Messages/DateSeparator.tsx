import type { MessageExt } from '@mikoto-io/mikoto.js';

import styles from './Messages.module.css';

const DATE_FORMAT = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function label(date: Date) {
  const now = new Date();
  if (sameDay(date, now)) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(date, yesterday)) return 'Yesterday';
  return DATE_FORMAT.format(date);
}

/** A centered day label between hairlines. */
export function DateSeparator({ date }: { date: Date }) {
  if (Number.isNaN(date.getTime())) return null;
  return (
    <div className={styles.day} role="separator">
      <time dateTime={date.toISOString()}>{label(date)}</time>
    </div>
  );
}

export function showDateSeparator(
  message: MessageExt,
  prevMessage?: MessageExt,
) {
  if (!prevMessage) return true;
  return !sameDay(new Date(prevMessage.timestamp), new Date(message.timestamp));
}
