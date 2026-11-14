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
import {
  Code,
  Heading1,
  Heading2,
  Heading3,
  Image,
  List,
  ListChecks,
  ListOrdered,
  type LucideIcon,
  Minus,
  Quote,
  Type,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { describeError, toast } from '@/design';
import { uploadFile } from '@/functions/fileUpload';

import { $createImageNode } from '../nodes/ImageNode';
import styles from './plugins.module.css';

class SlashMenuOption extends MenuOption {
  readonly label: string;
  readonly blockIcon: LucideIcon;
  readonly hint?: string;
  readonly keywords: string[];
  readonly onSelect: (editor: LexicalEditor) => void;

  constructor(
    label: string,
    options: {
      icon: LucideIcon;
      hint?: string;
      keywords?: string[];
      onSelect: (editor: LexicalEditor) => void;
    },
  ) {
    super(label);
    this.label = label;
    this.blockIcon = options.icon;
    this.hint = options.hint;
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
      icon: Type,
      keywords: ['paragraph', 'text', 'plain'],
      onSelect: () => $setBlockType(() => $createParagraphNode()),
    }),
    new SlashMenuOption('Heading 1', {
      icon: Heading1,
      hint: '#',
      keywords: ['heading', 'header', 'h1', 'title'],
      onSelect: () => $setHeading('h1'),
    }),
    new SlashMenuOption('Heading 2', {
      icon: Heading2,
      hint: '##',
      keywords: ['heading', 'header', 'h2', 'subtitle'],
      onSelect: () => $setHeading('h2'),
    }),
    new SlashMenuOption('Heading 3', {
      icon: Heading3,
      hint: '###',
      keywords: ['heading', 'header', 'h3'],
      onSelect: () => $setHeading('h3'),
    }),
    new SlashMenuOption('Bulleted list', {
      icon: List,
      hint: '-',
      keywords: ['bullet', 'unordered', 'ul', 'list'],
      onSelect: () =>
        editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined),
    }),
    new SlashMenuOption('Numbered list', {
      icon: ListOrdered,
      hint: '1.',
      keywords: ['number', 'ordered', 'ol', 'list'],
      onSelect: () =>
        editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined),
    }),
    new SlashMenuOption('Checklist', {
      icon: ListChecks,
      hint: '[]',
      keywords: ['check', 'checklist', 'todo', 'task', 'list'],
      onSelect: () =>
        editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined),
    }),
    new SlashMenuOption('Quote', {
      icon: Quote,
      hint: '>',
      keywords: ['quote', 'blockquote'],
      onSelect: () => $setBlockType(() => $createQuoteNode()),
    }),
    new SlashMenuOption('Code block', {
      icon: Code,
      hint: '```',
      keywords: ['code', 'codeblock', 'pre', 'snippet'],
      onSelect: () => $setBlockType(() => $createCodeNode()),
    }),
    new SlashMenuOption('Divider', {
      icon: Minus,
      hint: '---',
      keywords: ['divider', 'hr', 'horizontal', 'rule', 'separator'],
      onSelect: () =>
        editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined),
    }),
    new SlashMenuOption('Image', {
      icon: Image,
      keywords: ['image', 'picture', 'photo', 'media'],
      onSelect: () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) return;
          let url: string;
          try {
            const response = await uploadFile('/attachment', file);
            url = response.data.url;
          } catch (err) {
            toast({
              type: 'error',
              title: `Couldn't upload ${file.name}`,
              description: describeError(err, { context: 'action' }).message,
            });
            return;
          }
          editor.update(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) return;
            $insertNodes([$createImageNode(url, file.name)]);
          });
        };
        input.click();
      },
    }),
  ];
}

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
          <div
            className={styles.menu}
            role="listbox"
            aria-label="Insert a block"
          >
            {options.length === 0 ? (
              <div className={styles.menuEmpty}>No blocks match “{query}”.</div>
            ) : (
              <>
                <div className={styles.menuLabel} aria-hidden>
                  Blocks
                </div>
                {options.map((option, i) => {
                  const Icon = option.blockIcon;
                  return (
                    <button
                      type="button"
                      key={option.key}
                      ref={(el) => option.setRefElement(el)}
                      role="option"
                      aria-selected={selectedIndex === i}
                      className={styles.menuItem}
                      onMouseEnter={() => setHighlightedIndex(i)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setHighlightedIndex(i);
                        selectOptionAndCleanUp(option);
                      }}
                    >
                      <span className={styles.menuIcon} aria-hidden>
                        <Icon size={14} />
                      </span>
                      <span className={styles.menuText}>{option.label}</span>
                      {option.hint && (
                        <span className={styles.menuHint} aria-hidden>
                          {option.hint}
                        </span>
                      )}
                    </button>
                  );
                })}
              </>
            )}
          </div>,
          anchorElementRef.current,
        );
      }}
    />
  );
}
