import styled from '@emotion/styled';
import { MessageExt } from '@mikoto-io/mikoto.js';

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const StyledDateSeparator = styled.div`
  text-align: center;
  margin: 4px 0;
  color: var(--chakra-colors-gray-400);
  font-size: 12px;
  display: flex;
  align-items: center;

  &:before,
  &:after {
    content: '';
    display: block;
    flex-grow: 1;
    height: 0.5px;
    display: block;
    margin: 0 16px;
    background-color: var(--chakra-colors-gray-250);
    opacity: 0.1;
  }
`;

export function DateSeparator({ date }: { date: Date }) {
  return (
    <StyledDateSeparator>
      {DAYS_OF_WEEK[date.getDay()]} {date.toLocaleDateString()}
    </StyledDateSeparator>
  );
}

export function showDateSeparator(
  message: MessageExt,
  prevMessage?: MessageExt,
) {
  if (!prevMessage) return true;
  const prevDate = new Date(prevMessage.timestamp);
  const currDate = new Date(message.timestamp);
  return (
    prevDate.getFullYear() !== currDate.getFullYear() ||
    prevDate.getMonth() !== currDate.getMonth() ||
    prevDate.getDate() !== currDate.getDate()
  );
}
