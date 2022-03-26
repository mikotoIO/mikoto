import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styled from "styled-components";
import {faHashtag, faToriiGate} from "@fortawesome/free-solid-svg-icons";
import {Channel} from "../api";
import React from "react";

export const TreeContainer = styled.ul`
  list-style: none;
  margin: 10px;
  padding: 0;
  // width: 100%;
  box-sizing: border-box;
`;

const TreeNodeElement = styled.li`
  font-size: 14px;
  height: 20px;
  padding: 6px 10px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  color: rgba(255,255,255,0.8);
  
  &:hover {
    background-color: ${p => p.theme.colors.N700};
  }
`;

interface TreeNodeProps extends React.HTMLAttributes<HTMLLIElement> {
  channel: Channel;
}

const IconContainer = styled.span`
  background-color: #3b83ff;
  color: white;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  margin-right: 8px;
  width: 24px;
  height: 24px;
`;

export function TreeNode({ channel, ...props }: TreeNodeProps) {
  return (
    <TreeNodeElement {...props}>
      <IconContainer>
        <FontAwesomeIcon icon={faHashtag} />
      </IconContainer>
      {channel.name}
    </TreeNodeElement>
  )
}