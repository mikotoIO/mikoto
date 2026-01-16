import {
  $isListItemNode,
  $isListNode,
  ListItemNode,
  ListNode,
} from '@lexical/list';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  KEY_ENTER_COMMAND,
  LexicalNode,
} from 'lexical';
import { useEffect } from 'react';

/**
 * Plugin that handles exiting a list when Enter is pressed on an empty list item.
 * This matches the behavior of most text editors where pressing Enter on an empty
 * bullet/numbered list item exits the list instead of creating a new empty item.
 */
export function ListBehaviorPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return false;
        }

        const anchorNode = selection.anchor.getNode();
        const listItemNode = findListItemNode(anchorNode);

        if (!listItemNode) {
          return false;
        }

        // Check if the list item is empty (no text content)
        const textContent = listItemNode.getTextContent();
        if (textContent.length > 0) {
          return false;
        }

        // Prevent default Enter behavior
        event?.preventDefault();

        // Get the parent list
        const listNode = listItemNode.getParent();
        if (!$isListNode(listNode)) {
          return false;
        }

        // Check if this list is nested inside another list item
        const parentListItem = listNode.getParent();
        if ($isListItemNode(parentListItem)) {
          // Nested list: outdent by moving this item up one level
          const grandparentList = parentListItem.getParent();
          if ($isListNode(grandparentList)) {
            // Remove the empty list item
            listItemNode.remove();

            // If the nested list is now empty, remove it
            if (listNode.getChildrenSize() === 0) {
              listNode.remove();
            }

            // Create a new list item after the parent list item
            const newListItem = new ListItemNode();
            parentListItem.insertAfter(newListItem);
            newListItem.select();
            return true;
          }
        }

        // Top-level list: exit the list entirely
        const siblings = listNode.getChildren();
        const index = siblings.indexOf(listItemNode);

        if (siblings.length === 1) {
          // Only item in list - remove the entire list and create a paragraph
          const paragraph = $createParagraphNode();
          listNode.insertAfter(paragraph);
          listNode.remove();
          paragraph.select();
        } else if (index === siblings.length - 1) {
          // Last item - remove it and insert paragraph after list
          listItemNode.remove();
          const paragraph = $createParagraphNode();
          listNode.insertAfter(paragraph);
          paragraph.select();
        } else {
          // Middle item - split the list
          const paragraph = $createParagraphNode();

          // Get items after the current one
          const itemsAfter = siblings.slice(index + 1);

          // Remove the empty list item
          listItemNode.remove();

          // Insert paragraph after current list
          listNode.insertAfter(paragraph);

          // If there are items after, create a new list for them
          if (itemsAfter.length > 0) {
            const listType = listNode.getListType();
            const newList = new ListNode(listType, listNode.getStart());
            paragraph.insertAfter(newList);
            itemsAfter.forEach((item) => {
              newList.append(item);
            });
          }

          paragraph.select();
        }

        return true;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor]);

  return null;
}

function findListItemNode(node: LexicalNode): ListItemNode | null {
  let current: LexicalNode | null = node;
  while (current) {
    if ($isListItemNode(current)) {
      return current;
    }
    current = current.getParent();
  }
  return null;
}
