import { MikotoChannel } from '@mikoto-io/mikoto.js';
import type { LucideIcon } from 'lucide-react';

export interface ExplorerNode {
  id: string;
  text: string;
  icon?: LucideIcon;
  descendant?: ExplorerNode[];
  unread?: boolean;
  /** The channel is open in the focused tab. */
  active?: boolean;
  onClick?(ev: React.MouseEvent): void;
  onContextMenu?(ev: React.MouseEvent): void;
  onDragStart?(ev: React.DragEvent): void;
}

/**
 * Converts a flat channel list into a tree rooted at a synthetic 'root'
 * node. Channels whose parent isn't in the list are attached to the root,
 * so a missing or deleted parent never hides its children.
 */
export function channelToStructuredTree(
  channels: MikotoChannel[],
  nodeObjectFactory: (ch: MikotoChannel) => ExplorerNode,
): ExplorerNode {
  const rootChildren: ExplorerNode[] = [];
  const root: ExplorerNode = {
    id: 'root',
    text: '',
    descendant: rootChildren,
  };

  const map = new Map<string, ExplorerNode>();
  channels.forEach((channel) => {
    map.set(channel.id, nodeObjectFactory(channel));
  });

  channels.forEach((channel) => {
    const node = map.get(channel.id);
    if (!node) return;
    const parent = channel.parentId ? map.get(channel.parentId) : undefined;
    if (parent && parent !== node) {
      parent.descendant = [...(parent.descendant ?? []), node];
    } else {
      rootChildren.push(node);
    }
  });
  return root;
}

/** Sorts nodes alphabetically (locale-aware, case-insensitive). */
export function nodeSort(nodes?: ExplorerNode[]) {
  if (nodes === undefined) return undefined;
  return [...nodes].sort((a, b) =>
    a.text.localeCompare(b.text, undefined, { sensitivity: 'base' }),
  );
}

/** True if the node or any descendant is unread. */
export function subtreeUnread(node: ExplorerNode): boolean {
  return Boolean(node.unread) || (node.descendant ?? []).some(subtreeUnread);
}

/** True if the node or any descendant is the active channel. */
export function subtreeActive(node: ExplorerNode): boolean {
  return Boolean(node.active) || (node.descendant ?? []).some(subtreeActive);
}
