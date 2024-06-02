import { createHeadlessEditor } from '@lexical/headless';
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  TRANSFORMERS,
} from '@lexical/markdown';
import {
  Binding,
  Provider,
  createBinding,
  syncLexicalUpdateToYjs,
  syncYjsChangesToLexical,
} from '@lexical/yjs';
import { MARKDOWN_NODES } from '@mikoto-io/lexical-markdown';
import {
  $getRoot,
  Klass,
  LexicalEditor,
  LexicalNode,
  LexicalNodeReplacement,
} from 'lexical';
import { Doc, Transaction, YEvent } from 'yjs';

/**
 * Creates headless collaboration editor with no-op provider (since it won't
 * connect to message distribution infra) and binding. It also sets up
 * bi-directional synchronization between yDoc and editor
 */
function withHeadlessCollaborationEditor<T>(
  nodes: ReadonlyArray<Klass<LexicalNode> | LexicalNodeReplacement>,
  callback: (editor: LexicalEditor, binding: Binding, provider: Provider) => T,
): T {
  const editor = createHeadlessEditor({
    nodes,
  });

  const id = 'Editor';
  const doc = new Doc();
  const docMap = new Map([[id, doc]]);
  const provider = createNoOpProvider();
  const binding = createBinding(editor, provider, id, doc, docMap);

  const unsubscribe = registerCollaborationListeners(editor, provider, binding);

  const res = callback(editor, binding, provider);

  unsubscribe();

  return res;
}

function registerCollaborationListeners(
  editor: LexicalEditor,
  provider: Provider,
  binding: Binding,
): () => void {
  const unsubscribeUpdateListener = editor.registerUpdateListener(
    ({
      dirtyElements,
      dirtyLeaves,
      editorState,
      normalizedNodes,
      prevEditorState,
      tags,
    }) => {
      if (tags.has('skip-collab') === false) {
        syncLexicalUpdateToYjs(
          binding,
          provider,
          prevEditorState,
          editorState,
          dirtyElements,
          dirtyLeaves,
          normalizedNodes,
          tags,
        );
      }
    },
  );

  const observer = (events: Array<YEvent<any>>, transaction: Transaction) => {
    if (transaction.origin !== binding) {
      syncYjsChangesToLexical(binding, provider, events, false);
    }
  };

  binding.root.getSharedType().observeDeep(observer);

  return () => {
    unsubscribeUpdateListener();
    binding.root.getSharedType().unobserveDeep(observer);
  };
}

function createNoOpProvider(): Provider {
  const emptyFunction = () => {};

  return {
    awareness: {
      getLocalState: () => null,
      getStates: () => new Map(),
      off: emptyFunction,
      on: emptyFunction,
      setLocalState: emptyFunction,
    },
    connect: emptyFunction,
    disconnect: emptyFunction,
    off: emptyFunction,
    on: emptyFunction,
  };
}

export function markdownToYjs(markdown: string): Doc {
  return withHeadlessCollaborationEditor(MARKDOWN_NODES, (editor, binding) => {
    editor.update(
      () => $getRoot().clear(), // to prevent any conflicts
      { discrete: true },
    );

    editor.update(() => $convertFromMarkdownString(markdown, TRANSFORMERS), {
      discrete: true,
    });

    return binding.doc;
  });
}
