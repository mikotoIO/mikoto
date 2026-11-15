import type { EditorThemeClasses } from 'lexical';

import styles from './Documents.module.css';

/** Maps Lexical node types to the doc's CSS module classes. */
export const lexicalTheme: EditorThemeClasses = {
  code: styles.code,
  heading: {
    h1: styles.h1,
    h2: styles.h2,
    h3: styles.h3,
    h4: styles.h4,
    h5: styles.h5,
  },
  hr: styles.hr,
  image: styles.image,
  link: styles.link,
  list: {
    checklist: styles.checklist,
    listitem: styles.listItem,
    listitemChecked: styles.checked,
    listitemUnchecked: styles.unchecked,
    nested: {
      listitem: styles.nestedListItem,
    },
    ol: styles.ol,
    ul: styles.ul,
  },
  ltr: 'ltr',
  paragraph: styles.paragraph,
  quote: styles.quote,
  rtl: 'rtl',
  table: styles.table,
  tableCell: styles.tableCell,
  tableCellHeader: styles.tableCellHeader,
  text: {
    bold: styles.bold,
    code: styles.textCode,
    italic: styles.italic,
    strikethrough: styles.strikethrough,
    underline: styles.underline,
    underlineStrikethrough: styles.underlineStrikethrough,
  },
  // Read by @lexical/yjs when drawing other people's cursors.
  collaboration: {
    cursor: styles.cursor,
    cursorName: styles.cursorName,
    selection: styles.selection,
    selectionBg: styles.selectionBg,
  },
};
