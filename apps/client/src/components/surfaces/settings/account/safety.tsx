import { useSetAtom } from 'jotai';
import { KeyRound } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { modalState } from '@/components/ContextMenu';
import {
  Button,
  DialogClose,
  DialogContent,
  Field,
  Form,
  Input,
  PageTitle,
  Section,
} from '@/design';
import { useAuthClient } from '@/hooks';
import { useErrorElement } from '@/hooks/useErrorElement';
import { SettingSurface } from '@/views';

const PASSWORD_FORM_ID = 'change-password-form';

interface PasswordValues {
  oldPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

function PasswordChangeModal() {
  const authClient = useAuthClient();
  const { register, handleSubmit, getValues, formState } =
    useForm<PasswordValues>();
  const error = useErrorElement();
  const { errors } = formState;

  return (
    <DialogContent
      size="sm"
      title="Change password"
      description="After changing it, you'll sign in again with the new password."
      footer={
        <>
          <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
          <Button
            variant="primary"
            type="submit"
            form={PASSWORD_FORM_ID}
            loading={formState.isSubmitting}
          >
            Change password
          </Button>
        </>
      }
    >
      <Form
        id={PASSWORD_FORM_ID}
        onSubmit={handleSubmit(async (form) => {
          error.setError(null);
          try {
            await authClient.changePassword({
              oldPassword: form.oldPassword,
              newPassword: form.newPassword,
            });
            window.location.href = '/login';
          } catch (e) {
            error.setError(e);
          }
        })}
      >
        {error.el}
        <Field label="Current password" error={errors.oldPassword?.message}>
          <Input
            type="password"
            autoComplete="current-password"
            {...register('oldPassword', {
              required: 'Enter your current password.',
            })}
          />
        </Field>
        <Field label="New password" error={errors.newPassword?.message}>
          <Input
            type="password"
            autoComplete="new-password"
            {...register('newPassword', {
              required: 'Enter a new password.',
            })}
          />
        </Field>
        <Field
          label="Confirm new password"
          error={errors.confirmNewPassword?.message}
        >
          <Input
            type="password"
            autoComplete="new-password"
            {...register('confirmNewPassword', {
              required: 'Enter the new password again.',
              validate: (value) =>
                value === getValues('newPassword') ||
                "The passwords don't match.",
            })}
          />
        </Field>
      </Form>
    </DialogContent>
  );
}

export function SafetySurface() {
  const { t } = useTranslation();
  const setModal = useSetAtom(modalState);

  return (
    <SettingSurface>
      <PageTitle
        title={t('accountSettings.safety.title')}
        description="Keep your account secure."
      />

      <Section title={t('accountSettings.general.authentication')}>
        <Field
          orientation="horizontal"
          label="Password"
          description="Use a password you don't use anywhere else."
        >
          <Button onClick={() => setModal({ elem: <PasswordChangeModal /> })}>
            <KeyRound size={15} aria-hidden />
            {t('accountSettings.general.changePassword')}
          </Button>
        </Field>
        <Field
          orientation="horizontal"
          label={t('accountSettings.general.logOutOfAllDevices')}
          description="Signs out every session, including this one. Not available yet."
        >
          <Button disabled>
            {t('accountSettings.general.logOutOfAllDevices')}
          </Button>
        </Field>
      </Section>

      <Section title={t('accountSettings.general.dangerous')}>
        <Field
          orientation="horizontal"
          label={t('accountSettings.general.deleteAccount')}
          description="Permanently deletes your account and everything in it. Not available yet."
        >
          <Button variant="danger" disabled>
            {t('accountSettings.general.deleteAccount')}
          </Button>
        </Field>
      </Section>
    </SettingSurface>
  );
}
