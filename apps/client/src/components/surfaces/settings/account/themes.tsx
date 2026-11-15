import { useTranslation } from 'react-i18next';
import { useSnapshot } from 'valtio/react';

import {
  ACCENT_PRESETS,
  type Appearance,
  Button,
  DEFAULT_APPEARANCE,
  FONT_OPTIONS,
  Field,
  PageTitle,
  RoleName,
  Section,
  SegmentedControl,
  Slider,
  Switch,
  cx,
  toast,
  useAppearance,
} from '@/design';
import { useMikoto } from '@/hooks';
import { SettingSurface } from '@/views';

import styles from './themes.module.css';

const SAMPLE_ROLE_COLOR = '#F27BB0';

function initials(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || '?';
}

function LivePreview() {
  const mikoto = useMikoto();
  const userSnap = useSnapshot(mikoto.user);
  const myName = userSnap.me?.name ?? 'you';

  return (
    <div className={styles.preview} aria-label="Preview" role="group">
      <div className={cx(styles.msg, styles.mention)}>
        <div className={styles.avatar} aria-hidden>
          A
        </div>
        <div>
          <div className={styles.msgHead}>
            <RoleName
              className={styles.name}
              name="Amara"
              roleColor={SAMPLE_ROLE_COLOR}
              roleName="Moderator"
            />
            <time className={styles.time}>10:12</time>
          </div>
          <div className={styles.msgText}>
            <span className={styles.ment}>@{myName}</span> this is how mentions
            look with your settings.
          </div>
        </div>
      </div>
      <div className={styles.msg}>
        <div className={styles.avatar} aria-hidden>
          {initials(myName)}
        </div>
        <div>
          <div className={styles.msgHead}>
            <span className={styles.name}>{myName}</span>
            <time className={styles.time}>10:14</time>
          </div>
          <div className={styles.msgText}>
            And this is a regular message, with <code>inline code</code>.
          </div>
          <span className={styles.reaction}>👍 2</span>
        </div>
      </div>
    </div>
  );
}

const THEMES: { value: Appearance['theme']; label: string }[] = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'Match system' },
];

function ThemeMini({ theme }: { theme: Appearance['theme'] }) {
  if (theme === 'system') {
    return <div className={cx(styles.mini, styles.miniSystem)} />;
  }
  return (
    <div
      className={cx(
        styles.mini,
        theme === 'dark' ? styles.miniDark : styles.miniLight,
      )}
    >
      <span className={styles.miniNav}>
        <i />
        <i />
        <i />
        <i />
      </span>
      <i className={styles.miniSheet} />
    </div>
  );
}

function AccentPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (hex: string) => void;
}) {
  const isPreset = ACCENT_PRESETS.some(
    (p) => p.value.toLowerCase() === value.toLowerCase(),
  );
  return (
    <div className={styles.swatches}>
      {ACCENT_PRESETS.map((p) => (
        <button
          key={p.value}
          type="button"
          className={styles.swatch}
          style={{ '--c': p.value }}
          aria-label={p.name}
          title={p.name}
          aria-pressed={p.value.toLowerCase() === value.toLowerCase()}
          onClick={() => onChange(p.value)}
        />
      ))}
      <label className={styles.custom} data-active={!isPreset}>
        <input
          type="color"
          value={value}
          aria-label="Custom accent color"
          onChange={(e) => onChange(e.target.value)}
        />
        {value.toUpperCase()}
      </label>
    </div>
  );
}

export function ThemesSubsurface() {
  const { t } = useTranslation();
  const [appearance, setAppearance] = useAppearance();

  return (
    <SettingSurface>
      <PageTitle
        title={t('accountSettings.themes.title')}
        description="Changes apply as you make them and are saved on this device."
      />
      <LivePreview />

      <Section title="Theme">
        <div className={styles.themeCards} role="group" aria-label="Theme">
          {THEMES.map((th) => (
            <button
              key={th.value}
              type="button"
              className={styles.themeCard}
              aria-pressed={appearance.theme === th.value}
              onClick={() => setAppearance({ theme: th.value })}
            >
              <ThemeMini theme={th.value} />
              {th.label}
            </button>
          ))}
        </div>
      </Section>

      <Section
        title="Accent color"
        description="Your color for Home. Used for focus rings, mentions, unread counts and the send button."
      >
        <AccentPicker
          value={appearance.accent}
          onChange={(accent) => setAppearance({ accent })}
        />
      </Section>

      <Section>
        <Field
          orientation="horizontal"
          label="Text size"
          description="Applies to messages, docs and navigation."
        >
          <Slider
            min={12}
            max={18}
            value={appearance.textSize}
            format={(v) => `${v}px`}
            onValueChange={(textSize) => setAppearance({ textSize })}
          />
        </Field>
      </Section>

      <Section
        title="Typeface"
        description="Atkinson Hyperlegible is designed for readers with low vision."
      >
        <div>
          <SegmentedControl
            aria-label="Typeface"
            value={appearance.font}
            options={FONT_OPTIONS}
            onValueChange={(font) => setAppearance({ font })}
          />
        </div>
      </Section>

      <Section>
        <Field
          orientation="horizontal"
          label="Density"
          description="Compact fits more messages on screen."
        >
          <SegmentedControl
            aria-label="Density"
            value={appearance.density}
            options={[
              { value: 'comfortable', label: 'Comfortable' },
              { value: 'compact', label: 'Compact' },
            ]}
            onValueChange={(density) => setAppearance({ density })}
          />
        </Field>
      </Section>

      <Section>
        <Field orientation="horizontal" label="Corners">
          <SegmentedControl
            aria-label="Corners"
            value={appearance.radius}
            options={[
              { value: 'sharp', label: 'Sharp' },
              { value: 'soft', label: 'Soft' },
              { value: 'round', label: 'Round' },
            ]}
            onValueChange={(radius) => setAppearance({ radius })}
          />
        </Field>
      </Section>

      <Section>
        <Field
          orientation="horizontal"
          label="Background tint"
          description="Mix a little of the accent into backgrounds."
        >
          <SegmentedControl
            aria-label="Background tint"
            value={appearance.tint}
            options={[
              { value: 'neutral', label: 'Neutral' },
              { value: 'subtle', label: 'Subtle' },
              { value: 'rich', label: 'Rich' },
            ]}
            onValueChange={(tint) => setAppearance({ tint })}
          />
        </Field>
      </Section>

      <Section>
        <Field
          orientation="horizontal"
          label="Space colors"
          description="Let each space use its own accent while you're in it. Home always uses yours."
        >
          <Switch
            checked={appearance.spaceColors}
            onCheckedChange={(spaceColors) => setAppearance({ spaceColors })}
          />
        </Field>
      </Section>

      <Section>
        <Field
          orientation="horizontal"
          label="Roles"
          description="Colors come from each space's roles and are adjusted so names stay readable in both themes."
        >
          <SegmentedControl
            aria-label="Role display"
            value={appearance.roleStyle}
            options={[
              { value: 'color', label: 'Colored names' },
              { value: 'tag', label: 'Role tags' },
            ]}
            onValueChange={(roleStyle) => setAppearance({ roleStyle })}
          />
        </Field>
      </Section>

      <Section>
        <Field
          orientation="horizontal"
          label="Reduce motion"
          description="Turns off loading shimmer, fades and slides."
        >
          <Switch
            checked={appearance.reduceMotion}
            onCheckedChange={(reduceMotion) => setAppearance({ reduceMotion })}
          />
        </Field>
      </Section>

      <Section className={styles.lastSection}>
        <Field
          orientation="horizontal"
          label="Reset appearance"
          description="Go back to the default theme, accent and sizes."
        >
          <Button
            onClick={() => {
              setAppearance(DEFAULT_APPEARANCE);
              toast({ title: 'Appearance reset', type: 'success' });
            }}
          >
            Reset appearance
          </Button>
        </Field>
      </Section>
    </SettingSurface>
  );
}
