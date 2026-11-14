import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
} from '@lexical/markdown';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import {
  AutoLinkPlugin,
  createLinkMatcherWithRegExp,
} from '@lexical/react/LexicalAutoLinkPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { LexicalCollaboration } from '@lexical/react/LexicalCollaborationContext';
import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { MikotoChannel } from '@mikoto-io/mikoto.js';
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import debounce from 'lodash/debounce';
import { FileText, TriangleAlert } from 'lucide-react';
import {
  type ReactNode,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';

import { Surface } from '@/components/Surface';
import { TabName } from '@/components/tabs';
import {
  DelayedFallback,
  EmptyState,
  PaneHeader,
  RegionErrorBoundary,
  SegmentedControl,
  Skeleton,
  SkeletonGroup,
  SurfaceErrorBoundary,
} from '@/design';
import { useInterval, useMikoto } from '@/hooks';

import { DocumentPresence, describePeers } from './DocumentPresence';
import styles from './Documents.module.css';
import { EDITOR_NODES } from './editorNodes';
import { CodeBlockPlugin } from './plugins/CodeBlockPlugin';
import DraggableBlockPlugin from './plugins/DraggableBlockPlugin';
import { FloatingToolbarPlugin } from './plugins/FloatingToolbarPlugin';
import { HotkeyPlugin } from './plugins/HotkeyPlugin';
import { ImageUploadPlugin } from './plugins/ImageUploadPlugin';
import { ListBehaviorPlugin } from './plugins/ListBehaviorPlugin';
import { MarkdownPastePlugin } from './plugins/MarkdownPastePlugin';
import { SlashMenuPlugin } from './plugins/SlashMenuPlugin';
import {
  type DocPeer,
  type SyncState,
  useProviderFactory,
} from './providerFactory';
import { lexicalTheme } from './theme';
import { DOCUMENT_TRANSFORMERS } from './transformers';

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diffMs = date.getTime() - now;
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffMs / 60000);
  const diffHr = Math.round(diffMs / 3600000);
  const diffDay = Math.round(diffMs / 86400000);

  if (Math.abs(diffSec) < 60) return rtf.format(diffSec, 'second');
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
  if (Math.abs(diffHr) < 24) return rtf.format(diffHr, 'hour');
  return rtf.format(diffDay, 'day');
}

function useRelativeTime(date: Date | undefined): string | undefined {
  const [, tick] = useReducer((x: number) => x + 1, 0);

  useInterval(() => {
    tick();
  }, 10000);

  if (!date || Number.isNaN(date.getTime())) return undefined;
  return formatRelativeTime(date);
}

const URL_REGEX =
  /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

const EMAIL_REGEX =
  /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;

const LINK_MATCHERS = [
  createLinkMatcherWithRegExp(URL_REGEX, (text) =>
    text.startsWith('http') ? text : `https://${text}`,
  ),
  createLinkMatcherWithRegExp(EMAIL_REGEX, (text) => `mailto:${text}`),
];

// shouldPreserveNewLines=true makes Lexical's markdown import/export keep empty
// paragraphs 1:1 with blank lines, so round-tripping between read and edit
// modes doesn't collapse or multiply newlines.
function markdownToEditor(markdown: string): void {
  $convertFromMarkdownString(markdown, DOCUMENT_TRANSFORMERS, undefined, true);
}

function editorToMarkdown(): string {
  return $convertToMarkdownString(DOCUMENT_TRANSFORMERS, undefined, true);
}

type DocumentMode = 'read' | 'edit';
type SaveState = 'synced' | 'saving' | 'error';

const MODE_OPTIONS = [
  { value: 'read', label: 'Read' },
  { value: 'edit', label: 'Edit' },
] as const;

/* ------------------------------------------------------------- skeleton */

// width in %, 0 marks a heading
const SKELETON_LINES = [
  { id: 'p1', w: 92 },
  { id: 'p2', w: 97 },
  { id: 'p3', w: 70 },
  { id: 'h1', w: 0 },
  { id: 'p4', w: 88 },
  { id: 'p5', w: 95 },
  { id: 'p6', w: 60 },
];

/** Mirrors the doc body: paragraph lines with a heading partway down. */
function DocumentSkeleton() {
  return (
    <SkeletonGroup label="doc" className={styles.skeleton}>
      {SKELETON_LINES.map(({ id, w }) =>
        w ? (
          <Skeleton
            key={id}
            width={`${w}%`}
            height={13}
            className={styles.skeletonLine}
          />
        ) : (
          <Skeleton
            key={id}
            width="30%"
            height={20}
            className={styles.skeletonHeading}
          />
        ),
      )}
    </SkeletonGroup>
  );
}

const skeletonFallback = (
  <DelayedFallback>
    <DocumentSkeleton />
  </DelayedFallback>
);

/* --------------------------------------------------------------- editor */

function MikotoContentEditable({
  onAnchorRef,
}: {
  onAnchorRef?: (el: HTMLDivElement | null) => void;
}) {
  const [editor] = useLexicalComposerContext();

  return (
    <div
      className={styles.editor}
      onClick={() => editor.focus()}
      ref={onAnchorRef}
    >
      <ContentEditable className={styles.input} />
    </div>
  );
}

function ReadPlaceholder() {
  return (
    <div className={styles.emptyRead}>
      <p>This doc is empty.</p>
      <p>Switch to Edit, or double-click here, to start writing.</p>
    </div>
  );
}

function EditPlaceholder() {
  return (
    <div className={styles.placeholder}>
      Start writing, or type / to insert a heading, list or image.
    </div>
  );
}

function hash(str: string) {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

function documentContentQuery(channel: MikotoChannel) {
  return {
    queryKey: ['documents.get', channel.spaceId, channel.id],
    queryFn: async () => channel.getDocument(),
  };
}

function DocumentReadOnly({ content }: { content: string }) {
  return (
    <LexicalComposer
      key={hash(content)}
      initialConfig={{
        namespace: 'Editor',
        editable: false,
        nodes: EDITOR_NODES,
        theme: lexicalTheme,
        editorState: () => markdownToEditor(content),
        onError(error: Error) {
          throw error;
        },
      }}
    >
      <div className={styles.shell}>
        <RichTextPlugin
          contentEditable={<MikotoContentEditable />}
          placeholder={<ReadPlaceholder />}
          ErrorBoundary={LexicalErrorBoundary}
        />
      </div>
    </LexicalComposer>
  );
}

function DocumentReader({ channel }: { channel: MikotoChannel }) {
  const { data: document } = useSuspenseQuery(documentContentQuery(channel));
  return <DocumentReadOnly content={document.content} />;
}

/** How long to wait for the first sync before telling the user. */
const SYNC_TIMEOUT = 10_000;
/** Ignore brief disconnects (reconnects, StrictMode remounts). */
const WARNING_GRACE = 1_500;

function DocumentEditor({
  channel,
  onSaveStateChange,
  onPeersChange,
  onLiveUnavailableChange,
}: {
  channel: MikotoChannel;
  onSaveStateChange: (state: SaveState) => void;
  onPeersChange: (peers: DocPeer[]) => void;
  onLiveUnavailableChange: (unavailable: boolean) => void;
}) {
  // Reuse the reader's cached content so toggling into edit mode doesn't
  // re-fetch and fall through Suspense (which flashes the surface loader).
  const { data: document } = useSuspenseQuery(documentContentQuery(channel));
  // Only one client per session gets shouldBootstrap=true — the server
  // enforces single-claim semantics, and we cache the result forever so
  // repeated read/edit toggles don't trigger a Suspense fallback.
  const { data: shouldBootstrap } = useSuspenseQuery({
    queryKey: ['documents.bootstrap-claim', channel.spaceId, channel.id],
    queryFn: async () => channel.claimDocumentBootstrap(),
    staleTime: Infinity,
    gcTime: Infinity,
  });
  // The collab provider needs a round-trip to sync before the editor shows
  // any content, which would otherwise flash empty. Keep a read-only view
  // overlaid on top until the provider fires its first sync event.
  const [synced, setSynced] = useState(false);
  const [status, setStatus] = useState<SyncState>('initial');
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (synced) return;
    const t = setTimeout(() => setTimedOut(true), SYNC_TIMEOUT);
    return () => clearTimeout(t);
  }, [synced]);

  // If the provider can't connect, the read-only copy stays on screen and
  // the surface shows a non-blocking warning instead of a blank doc.
  const unavailable = status === 'error' || (!synced && timedOut);
  useEffect(() => {
    if (!unavailable) {
      onLiveUnavailableChange(false);
      return;
    }
    const t = setTimeout(() => onLiveUnavailableChange(true), WARNING_GRACE);
    return () => clearTimeout(t);
  }, [unavailable, onLiveUnavailableChange]);
  useEffect(
    () => () => onLiveUnavailableChange(false),
    [onLiveUnavailableChange],
  );

  return (
    <div className={styles.shell}>
      <div className={synced ? undefined : styles.hidden}>
        <LexicalCollaboration>
          <LexicalComposer
            initialConfig={{
              namespace: 'Editor',
              editable: true,
              nodes: EDITOR_NODES,
              theme: lexicalTheme,
              editorState: null,
              onError(error: Error) {
                throw error;
              },
            }}
          >
            <DocumentEditorInner
              channel={channel}
              initialContent={document.content}
              shouldBootstrap={shouldBootstrap}
              onSync={() => setSynced(true)}
              onStatusChange={setStatus}
              onPeersChange={onPeersChange}
              onSaveStateChange={onSaveStateChange}
            />
          </LexicalComposer>
        </LexicalCollaboration>
      </div>
      {!synced && (
        <div className={styles.overlay}>
          <DocumentReadOnly content={document.content} />
        </div>
      )}
    </div>
  );
}

// Per-user identity colors for collaboration cursors (like role colors,
// these identify people rather than theme the UI).
const CURSOR_COLORS = [
  'oklch(0.75 0.15 25)',
  'oklch(0.8 0.14 60)',
  'oklch(0.86 0.15 95)',
  'oklch(0.84 0.17 130)',
  'oklch(0.78 0.14 160)',
  'oklch(0.8 0.13 200)',
  'oklch(0.74 0.13 250)',
  'oklch(0.74 0.15 295)',
  'oklch(0.76 0.15 345)',
];

function cursorColorFor(userId: string): string {
  return CURSOR_COLORS[Math.abs(hash(userId)) % CURSOR_COLORS.length];
}

function PluginBoundary({
  what,
  children,
}: {
  what: string;
  children: ReactNode;
}) {
  return <RegionErrorBoundary what={what}>{children}</RegionErrorBoundary>;
}

function DocumentEditorInner({
  channel,
  initialContent,
  shouldBootstrap,
  onSync,
  onStatusChange,
  onPeersChange,
  onSaveStateChange,
}: {
  channel: MikotoChannel;
  initialContent: string;
  shouldBootstrap: boolean;
  onSync?: () => void;
  onStatusChange: (status: SyncState) => void;
  onPeersChange: (peers: DocPeer[]) => void;
  onSaveStateChange: (state: SaveState) => void;
}) {
  const mikoto = useMikoto();
  const { providerFactory } = useProviderFactory({
    channel,
    onSync,
    onStatusChange,
    onPeersChange,
  });
  const me = mikoto.user.me;
  const username = me?.name ?? 'Anonymous';
  const cursorColor = me ? cursorColorFor(me.id) : CURSOR_COLORS[0];
  const [anchorElem, setAnchorElem] = useState<HTMLDivElement | null>(null);
  // Lets other clients show who's here with the right identity.
  const awarenessData = useMemo(() => ({ userId: me?.id }), [me?.id]);

  // CollaborationPlugin has initialEditorState in its effect dep list, so
  // passing a fresh function every render tears down and reconnects the
  // provider on each re-render — which turned into an infinite reconnect
  // loop once setSynced re-renders fed back into it.
  const initialEditorState = useCallback(
    () => markdownToEditor(initialContent),
    [initialContent],
  );

  return (
    <>
      <RichTextPlugin
        contentEditable={<MikotoContentEditable onAnchorRef={setAnchorElem} />}
        placeholder={<EditPlaceholder />}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <MarkdownShortcutPlugin transformers={DOCUMENT_TRANSFORMERS} />
      <ImageUploadPlugin />
      <MarkdownPastePlugin />
      <AutoFocusPlugin />
      <AutoLinkPlugin matchers={LINK_MATCHERS} />
      <HotkeyPlugin channel={channel} />
      <ListBehaviorPlugin />
      <CheckListPlugin />
      <CodeBlockPlugin />
      <PluginBoundary what="The block menu">
        <SlashMenuPlugin />
      </PluginBoundary>
      <PluginBoundary what="The formatting toolbar">
        <FloatingToolbarPlugin />
      </PluginBoundary>
      {anchorElem && (
        <PluginBoundary what="Block dragging">
          <DraggableBlockPlugin anchorElem={anchorElem} />
        </PluginBoundary>
      )}
      <CollaborationPlugin
        id={channel.id}
        // y-websocket's awareness type is slightly looser than Lexical's;
        // structural shape matches at runtime.
        providerFactory={providerFactory as never}
        username={username}
        cursorColor={cursorColor}
        awarenessData={awarenessData}
        shouldBootstrap={shouldBootstrap}
        initialEditorState={initialEditorState}
      />
      <DocumentAutosave
        channel={channel}
        onSaveStateChange={onSaveStateChange}
      />
    </>
  );
}

function DocumentAutosave({
  channel,
  onSaveStateChange,
}: {
  channel: MikotoChannel;
  onSaveStateChange: (state: SaveState) => void;
}) {
  const [editor] = useLexicalComposerContext();
  const queryClient = useQueryClient();

  const save = useMemo(
    () =>
      debounce(() => {
        onSaveStateChange('saving');
        const content = editor.getEditorState().read(() => editorToMarkdown());
        channel
          .updateDocument({ content })
          .then((updated) => {
            onSaveStateChange('synced');
            // Keep the reader's cache in sync with what we just persisted, so
            // switching back to read mode doesn't trigger a background refetch
            // that re-keys the LexicalComposer and flashes the surface.
            queryClient.setQueryData(
              ['documents.get', channel.spaceId, channel.id],
              updated,
            );
          })
          .catch(() => {
            onSaveStateChange('error');
          });
      }, 1500),
    [channel, onSaveStateChange, editor, queryClient],
  );

  return <OnChangePlugin ignoreSelectionChange onChange={save} />;
}

/* -------------------------------------------------------------- surface */

function SaveStatus({ state }: { state: SaveState }) {
  if (state === 'saving') return <span>Saving…</span>;
  if (state === 'error')
    return (
      <span className={styles.saveError} role="status">
        Couldn&apos;t save your latest changes. Press Ctrl+S to try again.
      </span>
    );
  return <span>Saved</span>;
}

function DocumentView({ channel }: { channel: MikotoChannel }) {
  const [mode, setMode] = useState<DocumentMode>('read');
  const [saveState, setSaveState] = useState<SaveState>('synced');
  const [peers, setPeers] = useState<DocPeer[]>([]);
  const [liveUnavailable, setLiveUnavailable] = useState(false);
  const lastEdited = useRelativeTime(channel.lastUpdatedDate);

  const changeMode = (next: DocumentMode) => {
    setMode(next);
    if (next === 'read') setSaveState('synced');
  };

  const editing = describePeers(peers);

  return (
    <>
      <PaneHeader
        icon={<FileText size={16} aria-hidden />}
        title={channel.name}
        actions={
          <div className={styles.headerActions}>
            {mode === 'edit' && <DocumentPresence peers={peers} />}
            <SegmentedControl
              aria-label="Mode"
              value={mode}
              onValueChange={changeMode}
              options={MODE_OPTIONS}
            />
          </div>
        }
      />
      {mode === 'edit' && liveUnavailable && (
        <div className={styles.liveWarning} role="status">
          <TriangleAlert size={14} aria-hidden />
          Live editing is unavailable. Changes you make may not sync.
        </div>
      )}
      <div className={styles.scroll}>
        <div className={styles.inner}>
          <h1 className={styles.title}>{channel.name}</h1>
          <div className={styles.meta}>
            {lastEdited && <span>Edited {lastEdited}</span>}
            {mode === 'edit' && (
              <>
                {lastEdited && (
                  <span className={styles.metaSep} aria-hidden>
                    ·
                  </span>
                )}
                <SaveStatus state={saveState} />
              </>
            )}
            {mode === 'edit' && editing && (
              <>
                <span className={styles.metaSep} aria-hidden>
                  ·
                </span>
                <span>{editing}</span>
              </>
            )}
          </div>
          <SurfaceErrorBoundary what="This doc" resetKeys={[channel.id, mode]}>
            {mode === 'read' ? (
              <div onDoubleClick={() => changeMode('edit')}>
                <Suspense fallback={skeletonFallback}>
                  <DocumentReader channel={channel} />
                </Suspense>
              </div>
            ) : (
              <Suspense
                fallback={
                  <Suspense fallback={skeletonFallback}>
                    <DocumentReader channel={channel} />
                  </Suspense>
                }
              >
                <DocumentEditor
                  channel={channel}
                  onSaveStateChange={setSaveState}
                  onPeersChange={setPeers}
                  onLiveUnavailableChange={setLiveUnavailable}
                />
              </Suspense>
            )}
          </SurfaceErrorBoundary>
        </div>
      </div>
    </>
  );
}

export default function DocumentSurface({ channelId }: { channelId: string }) {
  const mikoto = useMikoto();
  const channel = mikoto.channels._get(channelId);

  if (!channel) {
    return (
      <Surface>
        <TabName name="Doc" icon={FileText} />
        <EmptyState
          icon={<FileText size={20} aria-hidden />}
          title="This doc isn't available"
          description="It may have been deleted, or you no longer have access to its space. Close this tab, or pick another doc from the sidebar."
        />
      </Surface>
    );
  }

  return (
    <Surface>
      <TabName
        name={channel.name}
        icon={channel.space?.icon ?? FileText}
        spaceId={channel.space?.id}
        spaceName={channel.space?.name}
      />
      <DocumentView channel={channel} />
    </Surface>
  );
}
