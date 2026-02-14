import type { Root, PhrasingContent, Text } from 'mdast';

const COMBINED_REGEX =
  /(@\w+)|(:(?:\+1|[-\w]+):)|(\|\|[\s\S]+?\|\|(?!\|))|(<\w+:[^\n]*>)/g;

function createCustomNode(
  hName: string,
  hProperties: Record<string, string>,
  children: PhrasingContent[] = [],
): PhrasingContent {
  return {
    type: 'text', // use text as base type so mdast doesn't complain
    data: { hName, hProperties },
    children,
  } as unknown as PhrasingContent;
}

function splitTextNode(node: Text): PhrasingContent[] {
  const text = node.value;
  const result: PhrasingContent[] = [];
  let lastIndex = 0;

  COMBINED_REGEX.lastIndex = 0;
  let match = COMBINED_REGEX.exec(text);

  while (match !== null) {
    if (match.index > lastIndex) {
      result.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }

    if (match[1]) {
      // Mention: @username
      const username = match[1].slice(1);
      result.push(
        createCustomNode('mention', { username }, [
          { type: 'text', value: match[0] },
        ]),
      );
    } else if (match[2]) {
      // Emoji: :emoji_name:
      const emojiId = match[2].slice(1, -1);
      result.push(createCustomNode('emoji', { id: emojiId }));
    } else if (match[3]) {
      // Spoiler: ||hidden text||
      const content = match[3].slice(2, -2);
      result.push(
        createCustomNode('spoiler', {}, [{ type: 'text', value: content }]),
      );
    } else if (match[4]) {
      // Object: <resource:data>
      const objMatch = /^<(\w+):([^\n]*)>$/.exec(match[4]);
      if (objMatch) {
        result.push(
          createCustomNode('object-embed', {
            resource: objMatch[1],
            data: objMatch[2],
          }),
        );
      }
    }

    lastIndex = match.index + match[0].length;
    match = COMBINED_REGEX.exec(text);
  }

  if (lastIndex < text.length) {
    result.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return result.length > 0 ? result : [node];
}

// Skip processing inside code nodes
const SKIP_TYPES = new Set(['code', 'inlineCode']);

function transformNode(node: any): void {
  if (!node.children || SKIP_TYPES.has(node.type)) return;

  const newChildren: any[] = [];
  for (const child of node.children) {
    if (child.type === 'text') {
      const split = splitTextNode(child);
      newChildren.push(...split);
    } else {
      transformNode(child);
      newChildren.push(child);
    }
  }
  node.children = newChildren;
}

export function remarkCustomSyntax() {
  return (tree: Root) => {
    transformNode(tree);
  };
}
