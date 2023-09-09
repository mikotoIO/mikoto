import { Editor, Extension, ReactRenderer } from '@tiptap/react';
import Suggestion from '@tiptap/suggestion';
import styled from 'styled-components';
import tippy from 'tippy.js';

const StyledCommandList = styled.div`
  background-color: var(--N1100);
  border: 1px solid var(--N600);
  padding: 8px 16px;
  border-radius: 8px;
  width: 200px;
  min-height: 300px;
  color: var(--N0);
`;

function CommandList() {
  return <StyledCommandList>Slash menu goes here</StyledCommandList>;
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
