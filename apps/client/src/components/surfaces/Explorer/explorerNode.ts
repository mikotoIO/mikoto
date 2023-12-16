import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { ClientChannel } from 'mikotojs';

export interface ExplorerNode {
  id: string;
  text: string;
  icon?: IconDefinition;
  descendant?: ExplorerNode[];
  unread?: boolean;
  onClick?(ev: React.MouseEvent): void;
  onContextMenu?(ev: React.MouseEvent): void;
}

/**
 * This function converts an array of channels into a structured tree of NodeObjects.
 * Each NodeObject represents a channel and contains an id, text, and an array of descendants.
 * The function uses a map to keep track of all NodeObjects by their id for easy lookup.
 * If a channel has a parentId, it is added as a descendant of the corresponding parent NodeObject.
 * If a channel does not have a parentId, it is added as a descendant of the root NodeObject.
 *
 * @param channels An array of channels to be converted into a structured tree.
 * @param nodeObjectFactory A factory function that takes a channel and returns a NodeObject.
 * @returns The root NodeObject of the structured tree.
 */
export function channelToStructuredTree(
  channels: ClientChannel[],
  nodeObjectFactory: (ch: ClientChannel) => ExplorerNode,
): ExplorerNode {
  const root: ExplorerNode = {
    id: 'root',
    text: '',
    descendant: [],
  };

  // first pass: create a map of nodes keyed by id
  // the root node (which does not correspond to a channel) has id 'root'
  const map = new Map<string, ExplorerNode>();
  map.set(root.id, root);
  channels.forEach((channel) => {
    const node: ExplorerNode = nodeObjectFactory(channel);
    map.set(node.id, node);
  });

  // second pass: add each node to its parent's descendant array
  channels.forEach((channel) => {
    const node = map.get(channel.id)!;
    if (channel.parentId) {
      const parent = map.get(channel.parentId);
      if (parent) {
        if (parent.descendant === undefined) parent.descendant = [];
        parent.descendant.push(node);
      }
    } else {
      root.descendant!.push(node);
    }
  });
  return root;
}

/**
 * sorts an array of nodes by alphabetical order.
 */
export function nodeSort(nodes?: ExplorerNode[]) {
  if (nodes === undefined) return undefined;
  return [...nodes].sort((a, b) => (a.text > b.text ? 1 : -1));
}
