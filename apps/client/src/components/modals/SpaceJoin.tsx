import { isAxiosError } from 'axios';
import { useSetAtom } from 'jotai';
import { useForm } from 'react-hook-form';

import { modalState } from '@/components/ContextMenu';
import {
  Button,
  DialogContent,
  Field,
  Form,
  Input,
  Section,
  toast,
} from '@/design';
import { useMikoto } from '@/hooks';
import { useErrorElement } from '@/hooks/useErrorElement';

/** Accepts a full invite link (…/invite/CODE) or just the code. */
function parseInviteCode(input: string) {
  const trimmed = input.trim();
  const match = trimmed.match(/\/invite\/([^/?#\s]+)/);
  return match ? match[1] : trimmed;
}

function SpaceCreateForm({ closeModal }: { closeModal: () => void }) {
  const mikoto = useMikoto();
  const form = useForm<{ spaceName: string }>();
  const error = useErrorElement();
  const { errors, isSubmitting } = form.formState;

  return (
    <Form
      onSubmit={form.handleSubmit(async (data) => {
        error.setError(null);
        try {
          const name = data.spaceName.trim();
          await mikoto.rest['spaces.create']({ name });
          toast({ title: `${name} created`, type: 'success' });
          closeModal();
          form.reset();
        } catch (e) {
          error.setError(e);
        }
      })}
    >
      {error.el}
      <Field label="Space name" error={errors.spaceName?.message}>
        <Input
          autoComplete="off"
          autoFocus
          placeholder="Academy City"
          {...form.register('spaceName', {
            validate: (v) => v.trim().length > 0 || 'Give your space a name.',
          })}
        />
      </Field>
      <Button variant="primary" block type="submit" loading={isSubmitting}>
        Create space
      </Button>
    </Form>
  );
}

function SpaceJoinForm({ closeModal }: { closeModal: () => void }) {
  const mikoto = useMikoto();
  const { register, handleSubmit, reset, formState } = useForm<{
    inviteCode: string;
  }>();
  const error = useErrorElement();
  const { errors, isSubmitting } = formState;

  return (
    <Form
      onSubmit={handleSubmit(async (data) => {
        error.setError(null);
        try {
          await mikoto.rest['spaces.join'](undefined, {
            params: { invite: parseInviteCode(data.inviteCode) },
          });
          toast({ title: 'Joined the space', type: 'success' });
          closeModal();
          reset();
        } catch (e) {
          const status = isAxiosError(e) ? e.response?.status : undefined;
          error.setError(
            status === 400 || status === 404 || status === 410
              ? 'This invite is invalid or has expired. Ask for a new link.'
              : e,
          );
        }
      })}
    >
      {error.el}
      <Field label="Invite link or code" error={errors.inviteCode?.message}>
        <Input
          autoComplete="off"
          spellCheck={false}
          placeholder="https://mikoto.io/invite/…"
          {...register('inviteCode', {
            validate: (v) =>
              v.trim().length > 0 || 'Paste an invite link or code.',
          })}
        />
      </Field>
      <Button block type="submit" loading={isSubmitting}>
        Join space
      </Button>
    </Form>
  );
}

export function SpaceJoinModal() {
  const setModal = useSetAtom(modalState);
  const close = () => setModal(null);

  return (
    <DialogContent
      size="sm"
      title="Create a space"
      description="A home for your community, with channels, voice and docs."
    >
      <SpaceCreateForm closeModal={close} />
      <Section
        title="Have an invite?"
        description="Paste the link or code to join an existing space."
      >
        <SpaceJoinForm closeModal={close} />
      </Section>
    </DialogContent>
  );
}
