import { type VerificationChallenge } from '@mikoto-io/mikoto.js';
import { useSetAtom } from 'jotai';
import { useState } from 'react';

import { modalState } from '@/components/ContextMenu';
import { Button, Field, Form, Input, Section, toast } from '@/design';
import { useErrorElement } from '@/hooks/useErrorElement';

import {
  HandleVerificationModal,
  isCustomDomain,
  settingsStyles,
} from './common';

/**
 * Handle editor shared by profile and space settings. Simple handles are set
 * directly; custom domains go through DNS / well-known verification.
 */
export function HandleSection({
  current,
  subject,
  description,
  placeholder,
  setHandle,
  releaseHandle,
  startVerification,
  completeVerification,
}: {
  current: string | null | undefined;
  /** "your" / "this space's", used in the verification dialog. */
  subject: string;
  description: string;
  placeholder: string;
  setHandle: (handle: string) => Promise<unknown>;
  releaseHandle: () => Promise<unknown>;
  startVerification: (handle: string) => Promise<VerificationChallenge>;
  completeVerification: (
    handle: string,
  ) => Promise<{ success: boolean; error?: string | null }>;
}) {
  const setModal = useSetAtom(modalState);
  const [handleInput, setHandleInput] = useState(current ?? '');
  const [saving, setSaving] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const error = useErrorElement();

  const trimmed = handleInput.trim();
  const custom = trimmed !== '' && isCustomDomain(trimmed);
  const unchanged = trimmed === (current ?? '');

  const release = async () => {
    setReleasing(true);
    error.setError(null);
    try {
      await releaseHandle();
      setHandleInput('');
      toast({ title: 'Handle released', type: 'success' });
    } catch (e) {
      error.setError(e);
    } finally {
      setReleasing(false);
    }
  };

  const save = async () => {
    if (!trimmed) {
      await release();
      return;
    }
    setSaving(true);
    error.setError(null);
    try {
      if (custom) {
        const challenge = await startVerification(trimmed);
        setModal({
          elem: (
            <HandleVerificationModal
              challenge={challenge}
              subject={subject}
              onVerify={async () => {
                const result = await completeVerification(trimmed);
                if (!result.success) {
                  throw new Error(
                    result.error ??
                      "We couldn't verify the domain. Check the DNS record or the file, then try again.",
                  );
                }
              }}
            />
          ),
        });
      } else {
        await setHandle(trimmed);
        toast({ title: `Handle set to @${trimmed}`, type: 'success' });
      }
    } catch (e) {
      error.setError(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section title="Handle" description={description}>
      {error.el}
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <Field
          label="Handle"
          description={
            custom && !unchanged ? (
              <span className={settingsStyles.note}>
                This looks like a custom domain. You'll verify that you own it
                next.
              </span>
            ) : undefined
          }
        >
          <Input
            value={handleInput}
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => setHandleInput(e.target.value)}
            placeholder={placeholder}
          />
        </Field>
        <div className={settingsStyles.inlineActions}>
          <Button
            variant="primary"
            type="submit"
            loading={saving}
            disabled={unchanged || releasing}
          >
            {custom && !unchanged ? 'Verify domain' : 'Save handle'}
          </Button>
          {current && (
            <Button
              variant="dangerGhost"
              loading={releasing}
              disabled={saving}
              onClick={release}
            >
              Release handle
            </Button>
          )}
        </div>
      </Form>
    </Section>
  );
}
