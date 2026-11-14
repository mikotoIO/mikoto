import { type MikotoSpace } from '@mikoto-io/mikoto.js';
import { Check } from 'lucide-react';
import { useState } from 'react';
import { useSnapshot } from 'valtio/react';

import {
  Button,
  Field,
  cx,
  describeError,
  onColor,
  spaceAccent,
  toast,
} from '@/design';

import styles from './SpaceAccentField.module.css';

// Mid-lightness hues that read on both themes and under white banner text.
const SPACE_PRESETS = [
  { name: 'Tide', value: '#2BB5A5' },
  { name: 'Sky', value: '#4AA3E8' },
  { name: 'Periwinkle', value: '#6C8CF0' },
  { name: 'Violet', value: '#9B7BEA' },
  { name: 'Orchid', value: '#CF6BD0' },
  { name: 'Rose', value: '#E8649A' },
  { name: 'Ember', value: '#E07A4F' },
  { name: 'Amber', value: '#E3B53C' },
  { name: 'Moss', value: '#5CB878' },
  { name: 'Slate', value: '#7D8494' },
];

/**
 * Space color: shown on the space's icon and sidebar banner, and used as
 * the UI accent for members who keep "Space colors" on.
 */
export function SpaceAccentField({ space }: { space: MikotoSpace }) {
  const snap = useSnapshot(space);
  const saved = spaceAccent(snap);
  const [draft, setDraft] = useState<string | null>(saved);
  const [saving, setSaving] = useState(false);
  const dirty = (draft ?? null)?.toLowerCase() !== saved?.toLowerCase();

  const save = async (accent: string | null) => {
    setSaving(true);
    try {
      await space.edit({ accent });
      toast({
        title: accent ? 'Space color updated' : 'Space color removed',
        type: 'success',
      });
    } catch (err) {
      toast({
        title: "Couldn't update the space color",
        description: describeError(err, { context: 'action' }).message,
        type: 'error',
      });
      setDraft(saved);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Field
      label="Space color"
      description="Shown on the space's icon and banner. Members who keep space colors on also see it as their accent while they're here."
    >
      <div className={styles.wrap}>
        <div
          className={styles.preview}
          style={draft ? { '--space': draft } : undefined}
          aria-hidden
        >
          <span
            className={styles.previewIcon}
            style={draft ? { color: onColor(draft) } : undefined}
          >
            {snap.name.slice(0, 2)}
          </span>
          <span className={styles.previewName}>{snap.name}</span>
        </div>

        <div
          className={styles.swatches}
          role="radiogroup"
          aria-label="Space color"
        >
          <button
            type="button"
            role="radio"
            aria-checked={draft === null}
            className={cx(styles.swatch, styles.none)}
            onClick={() => setDraft(null)}
            title="No color"
            aria-label="No color"
          />
          {SPACE_PRESETS.map((p) => {
            const active = draft?.toLowerCase() === p.value.toLowerCase();
            return (
              <button
                key={p.value}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={p.name}
                title={p.name}
                className={styles.swatch}
                style={{ '--c': p.value }}
                onClick={() => setDraft(p.value)}
              >
                {active && (
                  <Check size={14} strokeWidth={3} color={onColor(p.value)} />
                )}
              </button>
            );
          })}
          <label className={styles.custom}>
            <input
              type="color"
              value={draft ?? '#7d8494'}
              onChange={(e) => setDraft(e.target.value.toUpperCase())}
              aria-label="Custom space color"
            />
            {draft ?? 'Custom'}
          </label>
        </div>

        {dirty && (
          <div className={styles.actions}>
            <Button size="sm" variant="ghost" onClick={() => setDraft(saved)}>
              Reset
            </Button>
            <Button
              size="sm"
              variant="primary"
              loading={saving}
              onClick={() => save(draft)}
            >
              Save color
            </Button>
          </div>
        )}
      </div>
    </Field>
  );
}
