import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import { Switch as BaseSwitch } from '@base-ui/react/switch';
import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { Check, ChevronDown, Minus } from 'lucide-react';
import {
  type ComponentProps,
  type ReactNode,
  createContext,
  use,
  useId,
} from 'react';

import { cx } from '../cx';
import styles from './Form.module.css';

/* ------------------------------------------------------------------ Field */

interface FieldContextValue {
  id: string;
  describedBy?: string;
  invalid?: boolean;
}

const FieldContext = createContext<FieldContextValue | null>(null);

/** Props every control reads from its surrounding <Field>. */
function useFieldControl(props: {
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: ComponentProps<'input'>['aria-invalid'];
}) {
  const field = use(FieldContext);
  return {
    id: props.id ?? field?.id,
    'aria-describedby': props['aria-describedby'] ?? field?.describedBy,
    'aria-invalid': props['aria-invalid'] ?? (field?.invalid || undefined),
  };
}

export interface FieldProps {
  label?: ReactNode;
  /** Helps the user fill the field in. Shown under the label. */
  description?: ReactNode;
  /** @deprecated use `description` (kept for migration from Chakra) */
  helperText?: ReactNode;
  /** Says what is wrong and how to fix it. Shown when present. */
  error?: ReactNode;
  /** @deprecated use `error` */
  errorText?: ReactNode;
  invalid?: boolean;
  required?: boolean;
  /**
   * vertical: label above control (forms).
   * horizontal: text on the left, control on the right (settings rows).
   */
  orientation?: 'vertical' | 'horizontal';
  className?: string;
  children: ReactNode;
}

export function Field({
  label,
  description,
  helperText,
  error,
  errorText,
  invalid,
  required,
  orientation = 'vertical',
  className,
  children,
}: FieldProps) {
  const id = useId();
  const desc = description ?? helperText;
  const err = error ?? errorText;
  const descId = desc ? `${id}-desc` : undefined;
  const errId = err ? `${id}-err` : undefined;
  const describedBy = [descId, errId].filter(Boolean).join(' ') || undefined;

  return (
    <FieldContext value={{ id, describedBy, invalid: invalid || Boolean(err) }}>
      <div
        className={cx(
          styles.field,
          orientation === 'horizontal' && styles.horizontal,
          className,
        )}
      >
        {(label || desc) && (
          <div className={styles.fieldText}>
            {label && (
              <label htmlFor={id} className={styles.label}>
                {label}
                {required && (
                  <span className={styles.required} aria-hidden>
                    {' '}
                    *
                  </span>
                )}
              </label>
            )}
            {desc && (
              <p id={descId} className={styles.description}>
                {desc}
              </p>
            )}
          </div>
        )}
        <div className={styles.control}>{children}</div>
        {err && (
          <p id={errId} className={styles.error} role="alert">
            {err}
          </p>
        )}
      </div>
    </FieldContext>
  );
}

/* ----------------------------------------------------------- text inputs */

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      className={cx(styles.input, className)}
      {...props}
      {...useFieldControl(props)}
    />
  );
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cx(styles.input, styles.textarea, className)}
      {...props}
      {...useFieldControl(props)}
    />
  );
}

/** Native select, styled. Accessible and good on mobile for free. */
export function Select({ className, ...props }: ComponentProps<'select'>) {
  return (
    <span className={cx(styles.selectWrap, className)}>
      <select
        className={cx(styles.input, styles.select)}
        {...props}
        {...useFieldControl(props)}
      />
      <ChevronDown size={14} className={styles.selectIcon} aria-hidden />
    </span>
  );
}

/** Vertical stack for forms; spacing between fields is handled here. */
export function Form({ className, ...props }: ComponentProps<'form'>) {
  return <form className={cx(styles.form, className)} {...props} />;
}

/* ------------------------------------------------------ checkbox / switch */

interface ToggleControlProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  /** Visible label. Omit only when a surrounding <Field> provides one. */
  label?: ReactNode;
  name?: string;
  'aria-label'?: string;
  className?: string;
}

export function Checkbox({
  label,
  onCheckedChange,
  className,
  indeterminate,
  ...props
}: ToggleControlProps & { indeterminate?: boolean }) {
  const control = (
    <BaseCheckbox.Root
      className={styles.checkbox}
      indeterminate={indeterminate}
      onCheckedChange={(c) => onCheckedChange?.(c)}
      {...props}
      {...useFieldControl({})}
    >
      <BaseCheckbox.Indicator className={styles.checkboxIndicator}>
        {indeterminate ? (
          <Minus size={12} strokeWidth={3} />
        ) : (
          <Check size={12} strokeWidth={3} />
        )}
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  );
  if (!label) return control;
  return (
    <label className={cx(styles.toggleLabel, className)}>
      {control}
      <span>{label}</span>
    </label>
  );
}

export function Switch({
  label,
  onCheckedChange,
  className,
  ...props
}: ToggleControlProps) {
  const control = (
    <BaseSwitch.Root
      className={styles.switch}
      onCheckedChange={(c) => onCheckedChange?.(c)}
      {...props}
      {...useFieldControl({})}
    >
      <BaseSwitch.Thumb className={styles.switchThumb} />
    </BaseSwitch.Root>
  );
  if (!label) return control;
  return (
    <label className={cx(styles.toggleLabel, className)}>
      <span>{label}</span>
      {control}
    </label>
  );
}

/* ------------------------------------------------------- segmented control */

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
}

/** Pick one of a few options. Use a Select when there are more than ~5. */
export function SegmentedControl<T extends string>({
  value,
  onValueChange,
  options,
  'aria-label': ariaLabel,
  className,
}: {
  value: T;
  onValueChange: (value: T) => void;
  options: readonly SegmentedOption<T>[];
  'aria-label': string;
  className?: string;
}) {
  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(next) => {
        const picked = options.find((o) => o.value === next[0]);
        // Clicking the active segment would deselect it; keep a selection.
        if (picked) onValueChange(picked.value);
      }}
      aria-label={ariaLabel}
      className={cx(styles.segmented, className)}
    >
      {options.map((o) => (
        <Toggle key={o.value} value={o.value} className={styles.segment}>
          {o.label}
        </Toggle>
      ))}
    </ToggleGroup>
  );
}

/* ---------------------------------------------------------------- slider */

export function Slider({
  value,
  onValueChange,
  min,
  max,
  step = 1,
  format = String,
  'aria-label': ariaLabel,
}: {
  value: number;
  onValueChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  format?: (value: number) => string;
  'aria-label'?: string;
}) {
  const field = useFieldControl({});
  return (
    <span className={styles.slider}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={ariaLabel}
        onChange={(e) => onValueChange(e.target.valueAsNumber)}
        {...field}
      />
      <output htmlFor={field.id}>{format(value)}</output>
    </span>
  );
}
