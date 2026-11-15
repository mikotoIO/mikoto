import { ChevronDown } from 'lucide-react';
import React, { useState } from 'react';

import { SidebarRow } from '@/components/sidebars/Base';
import { cx } from '@/design';

import styles from './Explorer.module.css';
import {
  ExplorerNode,
  nodeSort,
  subtreeActive,
  subtreeUnread,
} from './explorerNode';

function Node(props: ExplorerNode) {
  const children = nodeSort(props.descendant);
  const isParent = Boolean(children && children.length > 0);
  // Start open when the active channel is inside, so it's never hidden.
  const [open, setOpen] = useState(() => isParent && subtreeActive(props));
  const [dragging, setDragging] = useState(false);
  const Icon = props.icon;
  // A collapsed parent shows unread if anything inside it is.
  const unread = open || !isParent ? props.unread : subtreeUnread(props);

  return (
    <div className={styles.node}>
      <SidebarRow
        icon={Icon ? <Icon size={16} aria-hidden /> : undefined}
        label={props.text}
        active={props.active}
        unread={unread}
        className={cx(
          isParent && styles.parentRow,
          dragging && styles.dragging,
        )}
        draggable={Boolean(props.onDragStart)}
        onClick={props.onClick}
        onContextMenu={props.onContextMenu}
        onDragStart={(ev) => {
          setDragging(true);
          props.onDragStart?.(ev);
        }}
        onDragEnd={() => setDragging(false)}
      />
      {isParent && (
        <button
          type="button"
          className={styles.disclosure}
          aria-expanded={open}
          aria-label={open ? `Collapse ${props.text}` : `Expand ${props.text}`}
          onClick={() => setOpen((o) => !o)}
        >
          <ChevronDown size={14} aria-hidden />
        </button>
      )}
      {open && children && (
        <div className={styles.subtree} role="group">
          {children.map((x) => (
            <Node key={x.id} {...x} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ChannelTree({
  nodes,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  nodes: ExplorerNode[];
}) {
  return (
    <div {...props}>
      {nodeSort(nodes)?.map((x) => <Node key={x.id} {...x} />)}
    </div>
  );
}
