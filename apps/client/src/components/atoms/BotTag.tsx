import styled from '@emotion/styled';

export const Tag = styled.span`
  display: inline-block;
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  background-color: var(--chakra-colors-primary);
`;

export function BotTag() {
  return <Tag>BOT</Tag>;
}
