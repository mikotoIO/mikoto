import { IconProp } from '@fortawesome/fontawesome-svg-core';
import {
  faHeading,
  faImage,
  faWandMagicSparkles,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Flex, Heading } from '@mikoto-io/lucid';
import { Editor, Extension, ReactRenderer } from '@tiptap/react';
import Suggestion from '@tiptap/suggestion';
import { useEffect, useState } from 'react';
import styled, { css } from 'styled-components';
import tippy from 'tippy.js';

const StyledCommandList = styled.div`
  background-color: var(--N1100);
  border: 1px solid var(--N600);
  padding: 8px;
  border-radius: 8px;
  width: 200px;
  max-height: 400px;
  color: var(--N0);
  display: flex;
  flex-direction: column;
`;

const CommandButton = styled.button<{ active?: boolean }>`
  outline: none;
  border: none;
  background-color: transparent;
  color: var(--N0);
  display: flex;
  gap: 8px;
  padding: 8px;
  border-radius: 4px;
  ${(p) =>
    p.active &&
    css`
      background-color: var(--N800);
    `}
`;

interface Command {
  name: string;
  description: string;
  icon?: IconProp;
}

const commands: Command[] = [
  {
    name: 'AI',
    description: 'Generate writing with AI',
    icon: faWandMagicSparkles,
  },
  {
    name: 'Heading',
    description: 'Add a heading',
    icon: faHeading,
  },
  {
    name: 'Image',
    description: 'Add an image',
    icon: faImage,
  },
];

function CommandList() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  useEffect(() => {
    const navigationKeys = ['ArrowUp', 'ArrowDown', 'Enter'];
    const keydownFn = (e: KeyboardEvent) => {
      if (navigationKeys.includes(e.key)) {
        e.preventDefault();
        if (e.key === 'ArrowUp') {
          setSelectedIndex(
            (selectedIndex + commands.length - 1) % commands.length,
          );
          return true;
        }
        if (e.key === 'ArrowDown') {
          setSelectedIndex((selectedIndex + 1) % commands.length);
          return true;
        }
        if (e.key === 'Enter') {
          return true;
        }
        return false;
      }
      return false;
    };

    document.addEventListener('keydown', keydownFn);
    return () => {
      document.removeEventListener('keydown', keydownFn);
    };
  });

  return (
    <StyledCommandList>
      {commands.map((command, idx) => (
        <CommandButton active={idx === selectedIndex}>
          <Flex center w={40} h={40} bg="N900" rounded={4} key={command.name}>
            {command.icon && <FontAwesomeIcon icon={command.icon} />}
          </Flex>
          <Box style={{ textAlign: 'left' }}>
            <Heading fs={16} m={0}>
              {command.name}
            </Heading>
            <Box fs={12}>{command.description}</Box>
          </Box>
        </CommandButton>
      ))}
    </StyledCommandList>
  );
}

function renderItem() {
  let component: ReactRenderer | null = null;
  let popup: any | null = null;

  return {
    onStart: (props: { editor: Editor; clientRect: DOMRect }) => {
      component = new ReactRenderer(CommandList, {
        props,
        editor: props.editor,
      });

      // @ts-ignore
      popup = tippy('body', {
        getReferenceClientRect: props.clientRect,
        appendTo: () => document.body,
        content: component.element,
        showOnCreate: true,
        interactive: true,
        trigger: 'manual',
        placement: 'bottom-start',
      });
    },

    onUpdate: (props: { editor: Editor; clientRect: DOMRect }) => {
      component?.updateProps(props);

      if (popup) {
        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        });
      }
    },
    onKeyDown: (props: { event: KeyboardEvent }) => {
      if (props.event.key === 'Escape') {
        popup?.[0].hide();

        return true;
      }

      // @ts-ignore
      return component?.ref?.onKeyDown(props);
    },
    onExit: () => {
      popup?.[0].destroy();
      component?.destroy();
    },
  };
}

export const SlashCommand = Extension.create({
  name: 'slash-command',
  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({
          editor,
          range,
          props,
        }: {
          editor: Editor;
          range: Range;
          props: any;
        }) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
}).configure({
  suggestion: {
    render: renderItem,
  },
});
