import styled from 'styled-components';

export const Tag = styled.span`
  display: inline-block;
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  background-color: var(--color-primary);
`;

export function BotTag() {
  return <Tag>BOT</Tag>;
}
