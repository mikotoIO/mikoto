import styles from './Documents.module.css';
import type { DocPeer } from './providerFactory';

const MAX_SHOWN = 4;

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '?';
  const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + second).toUpperCase();
}

/** "Rin is editing", "Rin and Theo are editing", "Rin, Theo and 2 others…" */
export function describePeers(peers: DocPeer[]): string | null {
  if (peers.length === 0) return null;
  const names = peers.map((p) => p.name.split(/\s+/)[0] || p.name);
  if (names.length === 1) return `${names[0]} is editing`;
  if (names.length === 2) return `${names[0]} and ${names[1]} are editing`;
  if (names.length === 3)
    return `${names[0]}, ${names[1]} and ${names[2]} are editing`;
  return `${names[0]}, ${names[1]} and ${names.length - 2} others are editing`;
}

/** Stacked initials of the other people in this doc, in their cursor color. */
export function DocumentPresence({ peers }: { peers: DocPeer[] }) {
  if (peers.length === 0) return null;
  const shown = peers.slice(0, MAX_SHOWN);
  const extra = peers.length - shown.length;
  return (
    <div className={styles.presence} aria-label={describePeers(peers) ?? ''}>
      {shown.map((peer) => (
        <span
          key={peer.key}
          className={`${styles.presenceAvatar} ${styles.presenceInitial}`}
          style={{ '--peer': peer.color }}
          title={peer.name}
          aria-hidden
        >
          {initials(peer.name)}
        </span>
      ))}
      {extra > 0 && (
        <span className={styles.presenceMore} aria-hidden>
          +{extra}
        </span>
      )}
    </div>
  );
}
