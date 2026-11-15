import { AxiosError, AxiosHeaders } from 'axios';
import {
  Bell,
  Copy,
  Hash,
  Inbox,
  Pencil,
  Pin,
  Plus,
  Search,
  Settings,
  Trash2,
  Users,
} from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';

import { Surface } from '@/components/Surface';
import { TabName } from '@/components/tabs';
import {
  ACCENT_PRESETS,
  type Appearance,
  Badge,
  Button,
  type ButtonVariant,
  Checkbox,
  Deferred,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
  Dot,
  EmptyState,
  ErrorState,
  FONT_OPTIONS,
  Field,
  Form,
  IconButton,
  Input,
  ItemErrorBoundary,
  Kbd,
  Menu,
  MenuContent,
  MenuGroupLabel,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  PageTitle,
  PaneHeader,
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
  RegionErrorBoundary,
  RoleName,
  Section,
  SegmentedControl,
  Select,
  Skeleton,
  SkeletonGroup,
  SkeletonText,
  Slider,
  Spinner,
  Switch,
  Tag,
  Textarea,
  Tooltip,
  toast,
  useAppearance,
} from '@/design';

import styles from './Palette.module.css';

/*
 * The living gallery of the design system (route /palette). Every '@/design'
 * component in every state, driven by the current appearance preferences.
 * When you add or change a component, add it here so it can be reviewed.
 */

const SECTIONS = [
  ['type', 'Type'],
  ['color', 'Color'],
  ['shape', 'Space & shape'],
  ['buttons', 'Buttons'],
  ['forms', 'Form controls'],
  ['display', 'Display'],
  ['chrome', 'Pane chrome'],
  ['overlays', 'Overlays'],
  ['toasts', 'Toasts'],
  ['loading', 'Loading'],
  ['errors', 'Errors'],
  ['empty', 'Empty states'],
] as const;

/* ------------------------------------------------------------- helpers */

function Specimen({
  label,
  children,
}: {
  label: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <div className={styles.specimenLabel}>{label}</div>
      <div>{children}</div>
    </>
  );
}

function GallerySection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div id={`palette-${id}`} className={styles.anchor}>
      <Section title={title} description={description}>
        {children}
      </Section>
    </div>
  );
}

/** A realistic API failure, so ErrorState shows production copy. */
function sampleError(status: number) {
  const config = {
    headers: new AxiosHeaders(),
    method: 'get',
    url: '/spaces/abc/messages',
  };
  return new AxiosError(
    `Request failed with status code ${status}`,
    'ERR_BAD_RESPONSE',
    config,
    null,
    {
      status,
      statusText: status === 503 ? 'Service Unavailable' : 'Not Found',
      data: {},
      headers: {},
      config,
    },
  );
}

/* ---------------------------------------------------------- appearance */

const THEME_OPTIONS = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System' },
] as const;

const DENSITY_OPTIONS = [
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'compact', label: 'Compact' },
] as const;

const RADIUS_OPTIONS = [
  { value: 'sharp', label: 'Sharp' },
  { value: 'soft', label: 'Soft' },
  { value: 'round', label: 'Round' },
] as const;

const TINT_OPTIONS = [
  { value: 'neutral', label: 'Neutral' },
  { value: 'subtle', label: 'Subtle' },
  { value: 'rich', label: 'Rich' },
] as const;

function isFont(value: string): value is Appearance['font'] {
  return FONT_OPTIONS.some((f) => f.value === value);
}

function AppearanceBar() {
  const [appearance, setAppearance] = useAppearance();
  return (
    <div className={styles.controls} role="group" aria-label="Appearance">
      <label className={styles.control}>
        Theme
        <SegmentedControl
          aria-label="Theme"
          value={appearance.theme}
          onValueChange={(theme) => setAppearance({ theme })}
          options={THEME_OPTIONS}
        />
      </label>
      <label className={styles.control}>
        Density
        <SegmentedControl
          aria-label="Density"
          value={appearance.density}
          onValueChange={(density) => setAppearance({ density })}
          options={DENSITY_OPTIONS}
        />
      </label>
      <div className={styles.control}>
        Accent
        <div className={styles.accents}>
          {ACCENT_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              className={styles.accentSwatch}
              style={{ '--swatch': preset.value }}
              aria-label={preset.name}
              title={preset.name}
              aria-pressed={
                appearance.accent.toLowerCase() === preset.value.toLowerCase()
              }
              onClick={() => setAppearance({ accent: preset.value })}
            />
          ))}
          <input
            type="color"
            className={styles.colorInput}
            aria-label="Custom accent"
            title="Custom accent"
            value={appearance.accent.toLowerCase()}
            onChange={(e) => setAppearance({ accent: e.target.value })}
          />
        </div>
      </div>
      <label className={styles.control}>
        Corners
        <SegmentedControl
          aria-label="Corners"
          value={appearance.radius}
          onValueChange={(radius) => setAppearance({ radius })}
          options={RADIUS_OPTIONS}
        />
      </label>
      <label className={styles.control}>
        Tint
        <SegmentedControl
          aria-label="Tint"
          value={appearance.tint}
          onValueChange={(tint) => setAppearance({ tint })}
          options={TINT_OPTIONS}
        />
      </label>
      <label className={styles.control}>
        Font
        <Select
          value={appearance.font}
          onChange={(e) => {
            const font = e.target.value;
            if (isFont(font)) setAppearance({ font });
          }}
        >
          {FONT_OPTIONS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </Select>
      </label>
      <div className={styles.control}>
        Text size
        <Slider
          aria-label="Text size"
          min={12}
          max={18}
          value={appearance.textSize}
          onValueChange={(textSize) => setAppearance({ textSize })}
          format={(v) => `${v}px`}
        />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- type */

const TYPE_SCALE = [
  ['--text-3xl', 650, 'Roadmap 2027'],
  ['--text-2xl', 650, 'Discover spaces'],
  ['--text-xl', 600, 'Offline packs'],
  ['--text-lg', 500, 'Jump to a channel, doc or person'],
  ['--text-md', 400, 'Tile cache rewrite is merged. Run the migration once.'],
  ['--text-sm', 400, 'Sidebar rows, secondary text and buttons'],
  ['--text-xs', 500, 'Timestamps, meta and group labels'],
] as const;

function TypeSection() {
  return (
    <GallerySection
      id="type"
      title="Type"
      description="One family (the user's choice). Hierarchy comes from size and weight: 400, 500, 600, and 650 for titles."
    >
      <div>
        {TYPE_SCALE.map(([token, weight, sample]) => (
          <div key={token} className={styles.typeRow}>
            <code className={styles.mono}>
              {token} · {weight}
            </code>
            <span
              className={styles.typeSample}
              style={{
                fontSize: `var(${token})`,
                fontWeight: weight,
                letterSpacing: weight >= 650 ? '-0.025em' : undefined,
              }}
            >
              {sample}
            </span>
          </div>
        ))}
        <div className={styles.typeRow}>
          <code className={styles.mono}>--font-mono</code>
          <span
            className={styles.typeSample}
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            tidepool cache migrate --dry-run
          </span>
        </div>
        <div className={styles.typeRow}>
          <code className={styles.mono}>text colors</code>
          <span className={styles.row}>
            <span>--text</span>
            <span style={{ color: 'var(--muted)' }}>--muted</span>
            <span style={{ color: 'var(--faint)' }}>--faint</span>
            <span style={{ color: 'var(--accent-ink)' }}>--accent-ink</span>
          </span>
        </div>
      </div>
    </GallerySection>
  );
}

/* --------------------------------------------------------------- color */

const COLOR_GROUPS = [
  ['Surface', ['--base', '--sheet', '--raised', '--overlay']],
  ['State', ['--hover', '--press']],
  ['Lines', ['--line', '--line-strong']],
  ['Text', ['--text', '--muted', '--faint']],
  ['Accent', ['--accent', '--on-accent', '--accent-ink', '--accent-soft']],
  [
    'Status',
    ['--danger', '--danger-soft', '--warn', '--warn-soft', '--ok', '--ok-soft'],
  ],
] as const;

/** Reads the computed value of each token, refreshed when appearance changes. */
function useTokenValues(tokens: readonly string[]) {
  const [appearance] = useAppearance();
  const [values, setValues] = useState<Record<string, string>>({});
  useEffect(() => {
    // Wait a frame so AppearanceRoot has applied the new attributes.
    const raf = requestAnimationFrame(() => {
      const css = getComputedStyle(document.documentElement);
      setValues(
        Object.fromEntries(
          tokens.map((t) => [t, css.getPropertyValue(t).trim()]),
        ),
      );
    });
    return () => cancelAnimationFrame(raf);
  }, [appearance, tokens]);
  return values;
}

const ALL_COLOR_TOKENS = COLOR_GROUPS.flatMap(([, tokens]) => tokens);

function ColorSection() {
  const values = useTokenValues(ALL_COLOR_TOKENS);
  return (
    <GallerySection
      id="color"
      title="Color"
      description="Semantic tokens for the current theme, tint and accent. Components only use these, never raw values."
    >
      <div>
        {COLOR_GROUPS.map(([group, tokens]) => (
          <div key={group} className={styles.swatchGroup}>
            <h4 className={styles.swatchGroupTitle}>{group}</h4>
            <div className={styles.swatches}>
              {tokens.map((token) => (
                <div key={token} className={styles.swatch}>
                  <div
                    className={styles.swatchColor}
                    style={{ '--swatch': `var(${token})` }}
                  />
                  <div className={styles.swatchText}>
                    <span className={styles.swatchName}>{token}</span>
                    <span className={styles.mono} title={values[token]}>
                      {values[token] && values[token].length > 24
                        ? 'color-mix(…)'
                        : (values[token] ?? '')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </GallerySection>
  );
}

/* --------------------------------------------------------------- shape */

const SPACES = [1, 2, 3, 4, 5, 6, 8, 10] as const;
const RADII = ['--r-ctl', '--r-sheet', '--r-pill'] as const;
const DENSITY_TOKENS = ['--row', '--ctl-h', '--ctl-h-sm', '--av'] as const;

function ShapeSection() {
  const values = useTokenValues(DENSITY_TOKENS);
  return (
    <GallerySection
      id="shape"
      title="Space & shape"
      description="A 4px grid. Corner radius and density follow the user's preferences."
    >
      <div className={styles.specimens}>
        {SPACES.map((n) => (
          <Specimen key={n} label={<code>--space-{n}</code>}>
            <div
              className={styles.spaceBar}
              style={{ width: `var(--space-${n})` }}
            />
          </Specimen>
        ))}
        <Specimen label="Radii">
          <div className={styles.row}>
            {RADII.map((r) => (
              <Tooltip key={r} content={r}>
                <div
                  className={styles.radiusBox}
                  style={{ borderRadius: `var(${r})` }}
                />
              </Tooltip>
            ))}
          </div>
        </Specimen>
        <Specimen label="Density">
          <div className={styles.row}>
            {DENSITY_TOKENS.map((t) => (
              <Tag key={t}>
                {t}: {values[t] ?? ''}
              </Tag>
            ))}
          </div>
        </Specimen>
      </div>
    </GallerySection>
  );
}

/* ------------------------------------------------------------- buttons */

const VARIANTS: { variant: ButtonVariant; label: string }[] = [
  { variant: 'primary', label: 'Create channel' },
  { variant: 'secondary', label: 'Copy invite' },
  { variant: 'ghost', label: 'Cancel' },
  { variant: 'danger', label: 'Delete space' },
  { variant: 'dangerGhost', label: 'Leave space' },
];

function ButtonsSection() {
  return (
    <GallerySection
      id="buttons"
      title="Buttons"
      description="Buttons say what they do. One primary per view."
    >
      <div className={styles.specimens}>
        {VARIANTS.map(({ variant, label }) => (
          <Specimen key={variant} label={<code>{variant}</code>}>
            <div className={styles.row}>
              <Button variant={variant} size="sm">
                {label}
              </Button>
              <Button variant={variant}>{label}</Button>
              <Button variant={variant} size="lg">
                {label}
              </Button>
              <Button variant={variant} loading>
                {label}
              </Button>
              <Button variant={variant} disabled>
                {label}
              </Button>
            </div>
          </Specimen>
        ))}
        <Specimen label="With icon">
          <div className={styles.row}>
            <Button variant="primary">
              <Plus size={14} aria-hidden />
              New doc
            </Button>
            <Button>
              <Copy size={14} aria-hidden />
              Copy link
            </Button>
          </div>
        </Specimen>
        <Specimen label={<code>block</code>}>
          <div style={{ maxWidth: 320 }}>
            <Button variant="primary" block>
              Join space
            </Button>
          </div>
        </Specimen>
        <Specimen label="IconButton">
          <div className={styles.row}>
            <IconButton aria-label="Search">
              <Search size={16} />
            </IconButton>
            <IconButton aria-label="Notifications" size="md">
              <Bell size={16} />
            </IconButton>
            <IconButton aria-label="New tab" variant="primary">
              <Plus size={16} />
            </IconButton>
            <IconButton aria-label="Settings" disabled>
              <Settings size={16} />
            </IconButton>
          </div>
        </Specimen>
      </div>
    </GallerySection>
  );
}

/* --------------------------------------------------------------- forms */

const VISIBILITY = [
  { value: 'public', label: 'Public' },
  { value: 'invite', label: 'Invite only' },
  { value: 'private', label: 'Private' },
] as const;

function FormsSection() {
  const [checked, setChecked] = useState(true);
  const [on, setOn] = useState(true);
  const [visibility, setVisibility] =
    useState<(typeof VISIBILITY)[number]['value']>('invite');
  const [volume, setVolume] = useState(70);

  return (
    <GallerySection
      id="forms"
      title="Form controls"
      description="Wrap controls in Field for labels, descriptions and errors; ids and aria wiring are automatic."
    >
      <div className={styles.specimens}>
        <Specimen label="Field">
          <Form className={styles.column} onSubmit={(e) => e.preventDefault()}>
            <Field
              label="Channel name"
              description="Lowercase, no spaces. Shown as #name."
              required
            >
              <Input placeholder="general" />
            </Field>
            <Field
              label="Handle"
              error="That handle is taken. Try adding a number or a word."
            >
              <Input defaultValue="tidepool" />
            </Field>
            <Field label="Disabled">
              <Input defaultValue="Can't change this" disabled />
            </Field>
            <Field label="Topic" description="Shown in the channel header.">
              <Textarea placeholder="What's this channel about?" rows={3} />
            </Field>
            <Field label="Notifications">
              <Select defaultValue="mentions">
                <option value="all">All messages</option>
                <option value="mentions">Only mentions</option>
                <option value="none">Nothing</option>
              </Select>
            </Field>
          </Form>
        </Specimen>
        <Specimen label="Horizontal field">
          <div className={styles.column} style={{ maxWidth: 560 }}>
            <Field
              orientation="horizontal"
              label="Space colors"
              description="Use each space's accent while you're in it."
            >
              <Switch checked={on} onCheckedChange={setOn} />
            </Field>
          </div>
        </Specimen>
        <Specimen label="Checkbox">
          <div className={styles.row}>
            <Checkbox
              label="Checked"
              checked={checked}
              onCheckedChange={setChecked}
            />
            <Checkbox label="Unchecked" defaultChecked={false} />
            <Checkbox label="Indeterminate" indeterminate checked />
            <Checkbox label="Disabled" disabled defaultChecked />
          </div>
        </Specimen>
        <Specimen label="Switch">
          <div className={styles.row}>
            <Switch label="On" checked={on} onCheckedChange={setOn} />
            <Switch label="Off" defaultChecked={false} />
            <Switch label="Disabled" disabled defaultChecked />
          </div>
        </Specimen>
        <Specimen label="SegmentedControl">
          <SegmentedControl
            aria-label="Visibility"
            value={visibility}
            onValueChange={setVisibility}
            options={VISIBILITY}
          />
        </Specimen>
        <Specimen label="Slider">
          <div style={{ maxWidth: 280 }}>
            <Slider
              aria-label="Volume"
              min={0}
              max={100}
              value={volume}
              onValueChange={setVolume}
              format={(v) => `${v}%`}
            />
          </div>
        </Specimen>
      </div>
    </GallerySection>
  );
}

/* ------------------------------------------------------------- display */

function DisplaySection() {
  return (
    <GallerySection
      id="display"
      title="Display"
      description="Small pieces used in rows and headers."
    >
      <div className={styles.specimens}>
        <Specimen label="Badge">
          <div className={styles.row}>
            <Badge count={3} />
            <Badge count={2} mention />
            <Badge count={128} />
            <Badge count={0} />
            <span className={styles.mono}>(0 renders nothing)</span>
          </div>
        </Specimen>
        <Specimen label="Dot">
          <div className={styles.row}>
            <Dot />
            <span className={styles.specimenLabel}>
              Unread, no room for a count
            </span>
          </div>
        </Specimen>
        <Specimen label="Tag">
          <div className={styles.row}>
            <Tag>Neutral</Tag>
            <Tag tone="accent">Accent</Tag>
            <Tag tone="ok">Online</Tag>
            <Tag tone="warn">Beta</Tag>
            <Tag tone="danger">Banned</Tag>
            <Tag color="#e8a33d">Moderator</Tag>
            <Tag color="#5865f2">Maintainer</Tag>
          </div>
        </Specimen>
        <Specimen label="Kbd">
          <div className={styles.row}>
            <Kbd>Ctrl K</Kbd>
            <Kbd>Esc</Kbd>
            <Kbd>⇧ Enter</Kbd>
          </div>
        </Specimen>
        <Specimen label="RoleName">
          <div className={styles.row}>
            <RoleName
              name="Rin Okabe"
              roleColor="#e8a33d"
              roleName="Moderator"
            />
            <RoleName name="Theo" roleColor="#5865f2" roleName="Maintainer" />
            <RoleName name="Juno" />
            <span className={styles.mono}>
              (follows the role style preference)
            </span>
          </div>
        </Specimen>
      </div>
    </GallerySection>
  );
}

/* -------------------------------------------------------------- chrome */

function ChromeSection() {
  return (
    <GallerySection
      id="chrome"
      title="Pane chrome"
      description="PaneHeader tops every tab. PageTitle and Section structure page-like tabs."
    >
      <div className={styles.specimens}>
        <Specimen label="PaneHeader">
          <div className={styles.frame}>
            <PaneHeader
              icon={<Hash size={16} aria-hidden />}
              title="general"
              topic="Tile cache, releases and everything else"
              actions={
                <>
                  <IconButton aria-label="Pinned messages">
                    <Pin size={16} />
                  </IconButton>
                  <IconButton aria-label="Members">
                    <Users size={16} />
                  </IconButton>
                </>
              }
            />
          </div>
        </Specimen>
        <Specimen label="PageTitle + Section">
          <div className={`${styles.frame} ${styles.framePad}`}>
            <PageTitle
              title="Appearance"
              description="Make Mikoto look the way you like."
              actions={<Button size="sm">Reset</Button>}
            />
            <Section
              title="Theme"
              description="Applies to every device you sign in on."
            >
              <SegmentedControl
                aria-label="Example"
                value="dark"
                onValueChange={() => undefined}
                options={THEME_OPTIONS}
              />
            </Section>
          </div>
        </Specimen>
      </div>
    </GallerySection>
  );
}

/* ------------------------------------------------------------ overlays */

function OverlaysSection() {
  return (
    <GallerySection
      id="overlays"
      title="Overlays"
      description="Floating things are the only place shadows appear."
    >
      <div className={styles.specimens}>
        <Specimen label="Dialog">
          <Dialog>
            <DialogTrigger render={<Button>Delete channel…</Button>} />
            <DialogContent
              title="Delete #general?"
              description="Everyone loses access to its messages. This can't be undone."
              size="sm"
              footer={
                <>
                  <DialogClose
                    render={<Button variant="ghost">Cancel</Button>}
                  />
                  <DialogClose
                    render={
                      <Button
                        variant="danger"
                        onClick={() =>
                          toast({ type: 'success', title: 'Channel deleted' })
                        }
                      >
                        Delete channel
                      </Button>
                    }
                  />
                </>
              }
            />
          </Dialog>
        </Specimen>
        <Specimen label="Menu">
          <Menu>
            <MenuTrigger render={<Button>Message actions</Button>} />
            <MenuContent>
              <MenuGroupLabel>Message</MenuGroupLabel>
              <MenuItem icon={<Pencil size={15} />} shortcut="E">
                Edit
              </MenuItem>
              <MenuItem icon={<Copy size={15} />}>Copy text</MenuItem>
              <MenuItem icon={<Pin size={15} />}>Pin to channel</MenuItem>
              <MenuSeparator />
              <MenuItem icon={<Trash2 size={15} />} danger>
                Delete message
              </MenuItem>
            </MenuContent>
          </Menu>
        </Specimen>
        <Specimen label="Popover">
          <Popover>
            <PopoverTrigger render={<Button>Show details</Button>} />
            <PopoverContent title="Tidepool">
              <p className={styles.popoverBody}>
                Open-source vector map tiles. 1,204 members.
              </p>
              <div className={styles.row} style={{ marginTop: 12 }}>
                <PopoverClose render={<Button size="sm">Close</Button>} />
              </div>
            </PopoverContent>
          </Popover>
        </Specimen>
        <Specimen label="Tooltip">
          <div className={styles.row}>
            <Tooltip content="Inbox">
              <IconButton aria-label="Inbox">
                <Inbox size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip content="Search" shortcut="Ctrl K" side="bottom">
              <IconButton aria-label="Search">
                <Search size={16} />
              </IconButton>
            </Tooltip>
          </div>
        </Specimen>
      </div>
    </GallerySection>
  );
}

/* -------------------------------------------------------------- toasts */

function ToastsSection() {
  const loadingThenDone = () => {
    const id = toast({ type: 'loading', title: 'Uploading roadmap.pdf…' });
    setTimeout(
      () =>
        toast.update(id, { type: 'success', title: 'roadmap.pdf uploaded' }),
      1600,
    );
  };
  return (
    <GallerySection
      id="toasts"
      title="Toasts"
      description="Name the action and its result. Errors stay longer and say how to recover."
    >
      <div className={styles.row}>
        <Button
          onClick={() => toast({ type: 'success', title: 'Invite copied' })}
        >
          Success
        </Button>
        <Button
          onClick={() =>
            toast({
              type: 'error',
              title: "Couldn't delete the channel",
              description:
                'The server ran into a problem. Try again in a moment.',
            })
          }
        >
          Error
        </Button>
        <Button
          onClick={() =>
            toast({
              type: 'info',
              title: 'Rin started a voice call',
              description: 'Office hours · 3 people',
            })
          }
        >
          Info
        </Button>
        <Button onClick={loadingThenDone}>Loading → success</Button>
        <Button
          onClick={() =>
            toast({
              type: 'success',
              title: 'Message deleted',
              action: {
                label: 'Undo',
                onClick: () =>
                  toast({ type: 'info', title: 'Message restored' }),
              },
            })
          }
        >
          With action
        </Button>
      </div>
    </GallerySection>
  );
}

/* ------------------------------------------------------------- loading */

function MessageSkeleton() {
  return (
    <SkeletonGroup label="messages">
      {[0, 1, 2].map((seed) => (
        <div key={seed} className={styles.skMessage}>
          <Skeleton circle width={34} />
          <div className={styles.skLines}>
            <Skeleton width={120 + seed * 30} height={12} />
            <SkeletonText lines={seed + 1} seed={seed} />
          </div>
        </div>
      ))}
    </SkeletonGroup>
  );
}

function LoadingSection() {
  const [loading, setLoading] = useState(false);
  const simulate = (ms: number) => {
    setLoading(true);
    setTimeout(() => setLoading(false), ms);
  };
  return (
    <GallerySection
      id="loading"
      title="Loading"
      description="Nothing for 150ms, then a skeleton that mirrors the layout, held for at least 300ms. Spinners are only for actions in progress."
    >
      <div className={styles.specimens}>
        <Specimen label="Skeleton">
          <div className={styles.row}>
            <Skeleton circle width={34} />
            <Skeleton width={140} height={13} />
            <Skeleton width={46} height={46} radius={12} />
          </div>
        </Specimen>
        <Specimen label="SkeletonText">
          <div style={{ maxWidth: 420 }}>
            <SkeletonText lines={4} />
          </div>
        </Specimen>
        <Specimen label="Mirrors layout">
          <div style={{ maxWidth: 520 }}>
            <MessageSkeleton />
          </div>
        </Specimen>
        <Specimen label="Deferred">
          <div className={styles.column}>
            <div className={styles.row}>
              <Button size="sm" onClick={() => simulate(100)}>
                Fast load (100ms)
              </Button>
              <Button size="sm" onClick={() => simulate(1500)}>
                Slow load (1.5s)
              </Button>
            </div>
            <div className={styles.deferredBox}>
              <Deferred loading={loading} skeleton={<SkeletonText lines={3} />}>
                <p style={{ margin: 0 }}>
                  Fast loads never flash a skeleton; slow ones show it, then
                  fade the content in.
                </p>
              </Deferred>
            </div>
          </div>
        </Specimen>
        <Specimen label="Spinner">
          <div className={styles.row}>
            <Spinner />
            <Spinner size={20} label="Sending" />
            <Button variant="primary" loading>
              Save changes
            </Button>
          </div>
        </Specimen>
      </div>
    </GallerySection>
  );
}

/* -------------------------------------------------------------- errors */

function Crashy({ crash, label }: { crash: boolean; label: string }) {
  if (crash) throw new Error(`${label} threw while rendering (demo)`);
  return <div className={styles.listItem}>{label}</div>;
}

function ErrorsSection() {
  const [crashRegion, setCrashRegion] = useState(false);
  const [crashItem, setCrashItem] = useState(false);
  return (
    <GallerySection
      id="errors"
      title="Errors"
      description="Three tiers, each failing alone: a whole tab, a region, a single item. Copy comes from describeError."
    >
      <div className={styles.specimens}>
        <Specimen label={<code>surface</code>}>
          <div className={`${styles.frame} ${styles.frameTall}`}>
            <ErrorState
              what="#general"
              error={sampleError(503)}
              onRetry={() => toast({ type: 'info', title: 'Retrying…' })}
            />
          </div>
        </Specimen>
        <Specimen label={<code>region</code>}>
          <div style={{ maxWidth: 320 }}>
            <ErrorState
              variant="region"
              what="Members"
              error={sampleError(503)}
              onRetry={() => toast({ type: 'info', title: 'Retrying…' })}
            />
          </div>
        </Specimen>
        <Specimen label={<code>inline</code>}>
          <ErrorState
            variant="inline"
            what="This message"
            error={new Error('Unknown embed type')}
            onRetry={() => toast({ type: 'info', title: 'Retrying…' })}
          />
        </Specimen>
        <Specimen label="Not retryable">
          <div style={{ maxWidth: 320 }}>
            <ErrorState
              variant="region"
              what="This doc"
              error={sampleError(404)}
            />
          </div>
        </Specimen>
        <Specimen label="Live boundaries">
          <div className={styles.column}>
            <div className={styles.row}>
              <Button size="sm" onClick={() => setCrashRegion(true)}>
                Crash the region
              </Button>
              <Button size="sm" onClick={() => setCrashItem(true)}>
                Crash one item
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setCrashRegion(false);
                  setCrashItem(false);
                }}
              >
                Reset
              </Button>
            </div>
            <RegionErrorBoundary
              what="Pinned messages"
              resetKeys={[crashRegion]}
            >
              <div className={styles.listDemo}>
                <Crashy crash={crashRegion} label="Pinned messages region" />
                {['First item', 'Second item', 'Third item'].map((label, i) => (
                  <ItemErrorBoundary
                    key={label}
                    what="This item"
                    resetKeys={[crashItem]}
                  >
                    <Crashy crash={crashItem && i === 1} label={label} />
                  </ItemErrorBoundary>
                ))}
              </div>
            </RegionErrorBoundary>
          </div>
        </Specimen>
      </div>
    </GallerySection>
  );
}

/* --------------------------------------------------------------- empty */

function EmptySection() {
  return (
    <GallerySection
      id="empty"
      title="Empty states"
      description="An empty screen invites the next action."
    >
      <div className={`${styles.frame} ${styles.frameTall}`}>
        <EmptyState
          icon={<Hash size={20} aria-hidden />}
          title="No channels yet"
          description="Channels keep conversations on topic. Create the first one to get started."
          action={
            <Button variant="primary">
              <Plus size={14} aria-hidden />
              Create channel
            </Button>
          }
        />
      </div>
    </GallerySection>
  );
}

/* ---------------------------------------------------------------- page */

export function DesignStory() {
  return (
    <Surface>
      <TabName name="Design system" />
      <div className={styles.layout}>
        <nav className={styles.nav} aria-label="Sections">
          <div className={styles.navLabel}>Design system</div>
          {SECTIONS.map(([id, label]) => (
            <a
              key={id}
              className={styles.navLink}
              href={`#palette-${id}`}
              onClick={(e) => {
                // Scroll inside the pane without touching the router's URL.
                e.preventDefault();
                document
                  .getElementById(`palette-${id}`)
                  ?.scrollIntoView({ block: 'start' });
              }}
            >
              {label}
            </a>
          ))}
        </nav>
        <div className={styles.main}>
          <div className={styles.page}>
            <AppearanceBar />
            <PageTitle
              title="Design system"
              description="Every component in '@/design', in every state, with the current appearance. Change the settings above to review themes, density and accents."
            />
            <TypeSection />
            <ColorSection />
            <ShapeSection />
            <ButtonsSection />
            <FormsSection />
            <DisplaySection />
            <ChromeSection />
            <OverlaysSection />
            <ToastsSection />
            <LoadingSection />
            <ErrorsSection />
            <EmptySection />
          </div>
        </div>
      </div>
    </Surface>
  );
}
