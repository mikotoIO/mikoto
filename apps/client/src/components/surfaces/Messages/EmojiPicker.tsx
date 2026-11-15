import {
  Apple,
  Car,
  Clock,
  Flag,
  Heart,
  Lightbulb,
  type LucideIcon,
  PawPrint,
  Search,
  Smile,
  Volleyball,
} from 'lucide-react';
import {
  type KeyboardEvent,
  type MouseEvent,
  type RefObject,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { z } from 'zod';

import { PopoverContent, Skeleton, cx } from '@/design';
import { LocalDB } from '@/store/LocalDB';

import styles from './EmojiPicker.module.css';
import {
  type EmojiEntry,
  type EmojiSet,
  emojiImageUrl,
  getLoadedEmojis,
  loadEmojis,
  searchEmojis,
} from './emojiData';

const COLS = 9;
const RECENT_MAX = COLS * 2;

const recentEmojiDB = new LocalDB(
  'recentEmojis',
  z.array(z.string()).catch([]),
  () => [],
);

const CATEGORY_META: Record<string, { label: string; icon: LucideIcon }> = {
  recent: { label: 'Recently used', icon: Clock },
  people: { label: 'Smileys & people', icon: Smile },
  nature: { label: 'Animals & nature', icon: PawPrint },
  foods: { label: 'Food & drink', icon: Apple },
  activity: { label: 'Activities', icon: Volleyball },
  places: { label: 'Travel & places', icon: Car },
  objects: { label: 'Objects', icon: Lightbulb },
  symbols: { label: 'Symbols', icon: Heart },
  flags: { label: 'Flags', icon: Flag },
};

interface Section {
  id: string;
  label: string;
  emojis: EmojiEntry[];
}

function useEmojiSet() {
  const [set, setSet] = useState<EmojiSet | null>(getLoadedEmojis);
  useEffect(() => {
    if (set) return;
    let cancelled = false;
    loadEmojis().then((s) => {
      if (!cancelled) setSet(s);
    });
    return () => {
      cancelled = true;
    };
  }, [set]);
  return set;
}

/** Arrow-key movement through the grid, by geometry so it works across
 *  sections whose last rows are short. */
function neighbour(
  buttons: HTMLElement[],
  current: HTMLElement,
  key: string,
): HTMLElement | null | 'search' {
  const i = buttons.indexOf(current);
  if (key === 'ArrowLeft') return buttons[i - 1] ?? null;
  if (key === 'ArrowRight') return buttons[i + 1] ?? null;
  if (key === 'Home') return buttons[0] ?? null;
  if (key === 'End') return buttons.at(-1) ?? null;
  const cur = current.getBoundingClientRect();
  const down = key === 'ArrowDown';
  let rowTop: number | null = null;
  let best: HTMLElement | null = null;
  let bestDx = Infinity;
  const ordered = down ? buttons.slice(i + 1) : buttons.slice(0, i).reverse();
  for (const b of ordered) {
    const r = b.getBoundingClientRect();
    if (down ? r.top <= cur.top + 1 : r.top >= cur.top - 1) continue;
    rowTop ??= r.top;
    if (Math.abs(r.top - rowTop) > 1) break;
    const dx = Math.abs(r.left - cur.left);
    if (dx < bestDx) {
      bestDx = dx;
      best = b;
    }
  }
  if (!best && !down) return 'search';
  return best;
}

const EmojiSection = memo(function EmojiSection({
  section,
  sectionRef,
  onHover,
}: {
  section: Section;
  sectionRef?: (el: HTMLElement | null) => void;
  onHover: (e: EmojiEntry) => void;
}) {
  return (
    <section
      ref={sectionRef}
      className={styles.section}
      data-section={section.id}
      aria-label={section.label}
    >
      <h3 className={styles.sectionTitle}>{section.label}</h3>
      <div className={styles.grid}>
        {section.emojis.map((e) => (
          <button
            key={e.id}
            type="button"
            tabIndex={-1}
            className={styles.cell}
            data-emoji={e.id}
            aria-label={e.name}
            onPointerEnter={() => onHover(e)}
            onFocus={() => onHover(e)}
          >
            <img
              src={emojiImageUrl(e)}
              alt={e.native}
              loading="lazy"
              draggable={false}
              width={24}
              height={24}
            />
          </button>
        ))}
      </div>
    </section>
  );
});

export interface EmojiPickerProps {
  /** `keepOpen` is true for shift-clicks, to pick several in a row. */
  onPick: (emoji: EmojiEntry, keepOpen: boolean) => void;
  searchRef?: RefObject<HTMLInputElement | null>;
}

export function EmojiPicker({ onPick, searchRef }: EmojiPickerProps) {
  const set = useEmojiSet();
  const [query, setQuery] = useState('');
  const [hovered, setHovered] = useState<EmojiEntry | null>(null);
  const [recent, setRecent] = useState(() => recentEmojiDB.get());
  const [active, setActive] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionElsRef = useRef(new Map<string, HTMLElement>());
  const localSearchRef = useRef<HTMLInputElement>(null);
  const inputRef = searchRef ?? localSearchRef;

  const searching = query.trim().length > 0;
  const sections = useMemo<Section[]>(() => {
    if (!set) return [];
    if (searching) {
      return [
        {
          id: 'results',
          label: 'Results',
          emojis: searchEmojis(set.list, query),
        },
      ];
    }
    const recentEmojis = recent.flatMap((id) => set.byId.get(id) ?? []);
    const base = set.categories.map((c) => ({
      id: c.id,
      label: CATEGORY_META[c.id]?.label ?? c.id,
      emojis: c.emojis,
    }));
    return recentEmojis.length
      ? [
          { id: 'recent', label: 'Recently used', emojis: recentEmojis },
          ...base,
        ]
      : base;
  }, [set, searching, query, recent]);

  const tabIds = useMemo(() => {
    if (!set) return [];
    const ids = set.categories.map((c) => c.id);
    return recent.length ? ['recent', ...ids] : ids;
  }, [set, recent]);

  const currentActive = searching ? null : (active ?? tabIds[0] ?? null);

  const sectionRefs = useMemo(() => {
    const refs: Record<string, (el: HTMLElement | null) => void> = {};
    for (const s of sections) {
      refs[s.id] = (el) => {
        if (el) sectionElsRef.current.set(s.id, el);
        else sectionElsRef.current.delete(s.id);
      };
    }
    return refs;
  }, [sections]);

  const onHover = useCallback((e: EmojiEntry) => setHovered(e), []);

  const pick = (e: EmojiEntry, keepOpen: boolean) => {
    const next = [e.id, ...recent.filter((id) => id !== e.id)].slice(
      0,
      RECENT_MAX,
    );
    recentEmojiDB.set(next);
    // Don't reshuffle "Recently used" under the pointer while picking several.
    if (!keepOpen) setRecent(next);
    onPick(e, keepOpen);
  };

  const emojiFromEvent = (target: EventTarget) => {
    if (!(target instanceof HTMLElement)) return null;
    const id = target.closest<HTMLElement>('[data-emoji]')?.dataset.emoji;
    return id ? (set?.byId.get(id) ?? null) : null;
  };

  const onGridClick = (ev: MouseEvent) => {
    const e = emojiFromEvent(ev.target);
    if (e) pick(e, ev.shiftKey);
  };

  const gridButtons = () =>
    Array.from(
      scrollRef.current?.querySelectorAll<HTMLElement>('[data-emoji]') ?? [],
    );

  const onGridKeyDown = (ev: KeyboardEvent) => {
    if (!(ev.target instanceof HTMLElement) || !ev.target.dataset.emoji) return;
    if (
      ![
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'Home',
        'End',
      ].includes(ev.key)
    ) {
      return;
    }
    ev.preventDefault();
    const next = neighbour(gridButtons(), ev.target, ev.key);
    if (next === 'search') inputRef.current?.focus();
    else next?.focus();
  };

  const onSearchKeyDown = (ev: KeyboardEvent<HTMLInputElement>) => {
    if (ev.key === 'ArrowDown') {
      ev.preventDefault();
      gridButtons()[0]?.focus();
    } else if (ev.key === 'Enter') {
      ev.preventDefault();
      const first = sections[0]?.emojis[0];
      if (searching && first) pick(first, ev.shiftKey);
    }
  };

  const jumpTo = (id: string) => {
    const el = sectionElsRef.current.get(id);
    const scroller = scrollRef.current;
    if (!el || !scroller) return;
    scroller.scrollTo({ top: el.offsetTop - scroller.offsetTop });
    setActive(id);
  };

  const onScroll = () => {
    const scroller = scrollRef.current;
    if (!scroller || searching) return;
    const top = scroller.scrollTop + scroller.offsetTop + 8;
    let current: string | null = null;
    for (const s of sections) {
      const el = sectionElsRef.current.get(s.id);
      if (el && el.offsetTop <= top) current = s.id;
    }
    if (current && current !== active) setActive(current);
  };

  const preview = hovered;
  const results = sections[0]?.emojis.length ?? 0;

  return (
    <div className={styles.body}>
      <div className={styles.head}>
        <label className={styles.search}>
          <Search size={14} className={styles.searchIcon} aria-hidden />
          <input
            ref={inputRef}
            className={styles.searchInput}
            placeholder="Search emoji"
            aria-label="Search emoji"
            value={query}
            spellCheck={false}
            autoComplete="off"
            onChange={(ev) => {
              setQuery(ev.target.value);
              setHovered(null);
              scrollRef.current?.scrollTo({ top: 0 });
            }}
            onKeyDown={onSearchKeyDown}
          />
        </label>
      </div>

      <nav className={styles.tabs} aria-label="Emoji categories">
        {tabIds.map((id) => {
          const meta = CATEGORY_META[id];
          if (!meta) return null;
          const Icon = meta.icon;
          return (
            <button
              key={id}
              type="button"
              className={cx(
                styles.tab,
                currentActive === id && styles.tabActive,
              )}
              aria-label={meta.label}
              title={meta.label}
              aria-current={currentActive === id || undefined}
              onClick={() => {
                if (searching) {
                  setQuery('');
                  // Sections re-render first; jump once they exist.
                  requestAnimationFrame(() => jumpTo(id));
                } else {
                  jumpTo(id);
                }
              }}
            >
              <Icon size={16} />
            </button>
          );
        })}
      </nav>

      <div
        ref={scrollRef}
        className={styles.scroll}
        onScroll={onScroll}
        onClick={onGridClick}
        onKeyDown={onGridKeyDown}
      >
        {!set ? (
          <div className={styles.loading} aria-hidden>
            {Array.from({ length: COLS * 6 }, (_, i) => (
              <Skeleton key={i} width={24} height={24} radius={6} />
            ))}
          </div>
        ) : searching && results === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyTitle}>No emoji found</span>
            <span>Nothing matches “{query.trim()}”.</span>
          </div>
        ) : (
          sections.map((s) => (
            <EmojiSection
              key={s.id}
              section={s}
              sectionRef={sectionRefs[s.id]}
              onHover={onHover}
            />
          ))
        )}
      </div>

      <div className={styles.foot}>
        {preview ? (
          <>
            <img
              className={styles.previewImage}
              src={emojiImageUrl(preview)}
              alt={preview.native}
              width={28}
              height={28}
            />
            <div className={styles.previewText}>
              <span className={styles.previewName}>{preview.name}</span>
              <span className={styles.previewCode}>:{preview.id}:</span>
            </div>
          </>
        ) : (
          <span className={styles.hint}>Shift-click to pick several</span>
        )}
      </div>
    </div>
  );
}

type PopoverProps = Parameters<typeof PopoverContent>[0];

/** The picker in a popover above `anchor`; render inside a `<Popover>`. */
export function EmojiPickerPopover({
  anchor,
  finalFocus,
  onPick,
}: {
  anchor?: PopoverProps['anchor'];
  finalFocus?: PopoverProps['finalFocus'];
  onPick: EmojiPickerProps['onPick'];
}) {
  const searchRef = useRef<HTMLInputElement>(null);
  return (
    <PopoverContent
      bare
      side="top"
      align="start"
      sideOffset={6}
      anchor={anchor}
      initialFocus={searchRef}
      finalFocus={finalFocus}
      className={styles.picker}
    >
      <EmojiPicker onPick={onPick} searchRef={searchRef} />
    </PopoverContent>
  );
}
