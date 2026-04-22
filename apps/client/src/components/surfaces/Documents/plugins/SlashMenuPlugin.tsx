import styled from '@emotion/styled';
import {
  faCode,
  faFont,
  faHeading,
  faImage,
  faListCheck,
  faListOl,
  faListUl,
  faMinus,
  faQuoteRight,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { $createCodeNode } from '@lexical/code';
import {
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  useBasicTypeaheadTriggerMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin';
import {
  $createHeadingNode,
  $createQuoteNode,
  HeadingTagType,
} from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';
import {
  $createParagraphNode,
  $getSelection,
  $insertNodes,
  $isRangeSelection,
  ElementNode,
  LexicalEditor,
  TextNode,
} from 'lexical';
import { useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { uploadFile } from '@/functions/fileUpload';

import { $createImageNode } from '../nodes/ImageNode';

class SlashMenuOption extends MenuOption {
  readonly label: string;
  readonly iconDef: IconDefinition;
  readonly keywords: string[];
  readonly onSelect: (editor: LexicalEditor) => void;

  constructor(
    label: string,
    options: {
      icon: IconDefinition;
      keywords?: string[];
      onSelect: (editor: LexicalEditor) => void;
    },
  ) {
    super(label);
    this.label = label;
    this.iconDef = options.icon;
    this.keywords = options.keywords ?? [];
    this.onSelect = options.onSelect;
  }
}

function $setBlockType(creator: () => ElementNode) {
  const selection = $getSelection();
  if ($isRangeSelection(selection)) {
    $setBlocksType(selection, creator);
  }
}

function $setHeading(level: HeadingTagType) {
  $setBlockType(() => $createHeadingNode(level));
}

function getBaseOptions(editor: LexicalEditor): SlashMenuOption[] {
  return [
    new SlashMenuOption('Text', {
      icon: faFont,
      keywords: ['paragraph', 'text', 'plain'],
      onSelect: () => $setBlockType(() => $createParagraphNode()),
    }),
    new SlashMenuOption('Heading 1', {
      icon: faHeading,
      keywords: ['heading', 'header', 'h1', 'title'],
      onSelect: () => $setHeading('h1'),
    }),
    new SlashMenuOption('Heading 2', {
      icon: faHeading,
      keywords: ['heading', 'header', 'h2', 'subtitle'],
      onSelect: () => $setHeading('h2'),
    }),
    new SlashMenuOption('Heading 3', {
      icon: faHeading,
      keywords: ['heading', 'header', 'h3'],
      onSelect: () => $setHeading('h3'),
    }),
    new SlashMenuOption('Bulleted List', {
      icon: faListUl,
      keywords: ['bullet', 'unordered', 'ul', 'list'],
      onSelect: () =>
        editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined),
    }),
    new SlashMenuOption('Numbered List', {
      icon: faListOl,
      keywords: ['number', 'ordered', 'ol', 'list'],
      onSelect: () =>
        editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined),
    }),
    new SlashMenuOption('Check List', {
      icon: faListCheck,
      keywords: ['check', 'checklist', 'todo', 'task', 'list'],
      onSelect: () =>
        editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined),
    }),
    new SlashMenuOption('Quote', {
      icon: faQuoteRight,
      keywords: ['quote', 'blockquote'],
      onSelect: () => $setBlockType(() => $createQuoteNode()),
    }),
    new SlashMenuOption('Code Block', {
      icon: faCode,
      keywords: ['code', 'codeblock', 'pre', 'snippet'],
      onSelect: () => $setBlockType(() => $createCodeNode()),
    }),
    new SlashMenuOption('Divider', {
      icon: faMinus,
      keywords: ['divider', 'hr', 'horizontal', 'rule', 'separator'],
      onSelect: () =>
        editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined),
    }),
    new SlashMenuOption('Image', {
      icon: faImage,
      keywords: ['image', 'picture', 'photo', 'media'],
      onSelect: () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) return;
          const response = await uploadFile('/attachment', file);
          editor.update(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) return;
            $insertNodes([$createImageNode(response.data.url, file.name)]);
          });
        };
        input.click();
      },
    }),
  ];
}

const MenuContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 240px;
  max-height: 320px;
  overflow-y: auto;
  padding: 4px;
  background: var(--chakra-colors-gray-800);
  border: 1px solid var(--chakra-colors-gray-600);
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
`;

const MenuItem = styled.button<{ selected?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 6px 8px;
  border: none;
  background: ${(p) =>
    p.selected ? 'var(--chakra-colors-gray-700)' : 'transparent'};
  color: var(--chakra-colors-gray-100);
  border-radius: 4px;
  cursor: pointer;
  text-align: left;
  font-size: 13px;

  &:hover {
    background: var(--chakra-colors-gray-700);
  }
`;

const MenuItemIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  color: var(--chakra-colors-gray-300);
  font-size: 12px;
`;

const EmptyMessage = styled.div`
  padding: 8px;
  color: var(--chakra-colors-gray-400);
  font-size: 12px;
`;

export function SlashMenuPlugin() {
  const [editor] = useLexicalComposerContext();
  const [query, setQuery] = useState<string | null>(null);

  const baseOptions = useMemo(() => getBaseOptions(editor), [editor]);

  const options = useMemo(() => {
    if (!query) return baseOptions;
    const q = query.toLowerCase();
    return baseOptions.filter((opt) => {
      if (opt.label.toLowerCase().includes(q)) return true;
      return opt.keywords.some((k) => k.includes(q));
    });
  }, [baseOptions, query]);

  const triggerFn = useBasicTypeaheadTriggerMatch('/', { minLength: 0 });

  const onSelectOption = useCallback(
    (
      selectedOption: SlashMenuOption,
      nodeToRemove: TextNode | null,
      closeMenu: () => void,
    ) => {
      editor.update(() => {
        nodeToRemove?.remove();
        selectedOption.onSelect(editor);
      });
      closeMenu();
    },
    [editor],
  );

  return (
    <LexicalTypeaheadMenuPlugin<SlashMenuOption>
      triggerFn={triggerFn}
      onQueryChange={setQuery}
      onSelectOption={onSelectOption}
      options={options}
      menuRenderFn={(
        anchorElementRef,
        { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex },
      ) => {
        if (!anchorElementRef.current) return null;
        return createPortal(
          <MenuContainer>
            {options.length === 0 ? (
              <EmptyMessage>No matching blocks</EmptyMessage>
            ) : (
              options.map((option, i) => (
                <MenuItem
                  key={option.key}
                  ref={(el) => option.setRefElement(el)}
                  selected={selectedIndex === i}
                  onMouseEnter={() => setHighlightedIndex(i)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setHighlightedIndex(i);
                    selectOptionAndCleanUp(option);
                  }}
                >
                  <MenuItemIcon>
                    <FontAwesomeIcon icon={option.iconDef} />
                  </MenuItemIcon>
                  {option.label}
                </MenuItem>
              ))
            )}
          </MenuContainer>,
          anchorElementRef.current,
        );
      }}
    />
  );
}
