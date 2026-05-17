import { Box, Flex, Input } from '@chakra-ui/react';
import { useSetAtom } from 'jotai';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { modalState } from '@/components/ContextMenu';
import { Button, DialogContent, Field } from '@/components/ui';
import { useAuthClient } from '@/hooks';
import { useErrorElement } from '@/hooks/useErrorElement';
import { Form } from '@/ui';
import { SettingSurface } from '@/views';

function PasswordChangeModal() {
  const authClient = useAuthClient();

  const { register, handleSubmit, getValues } = useForm();
  const error = useErrorElement();

  return (
    <DialogContent rounded="md" p={4} maxW="480px">
      <Form
        style={{ minWidth: 400 }}
        onSubmit={handleSubmit(async (form) => {
          try {
            await authClient.changePassword({
              oldPassword: form.oldPassword,
              newPassword: form.newPassword,
            });
            window.location.href = '/login';
          } catch (e) {
            error.setError((e as any)?.response?.data);
          }
        })}
      >
        <h1>Change Password</h1>
        {error.el}

        <Field label="Old Password">
          <Input
            type="password"
            {...register('oldPassword', { required: true })}
          />
        </Field>
        <Field label="New Password">
          <Input
            type="password"
            {...register('newPassword', { required: true })}
          />
        </Field>
        <Field label="Confirm New Password">
          <Input
            type="password"
            {...register('confirmNewPassword', {
              required: true,
              validate: (value) => value === getValues('newPassword'),
            })}
          />
        </Field>

        <Button colorPalette="primary" type="submit">
          Change Password
        </Button>
      </Form>
    </DialogContent>
  );
}

export function SafetySurface() {
  const { t } = useTranslation();
  const setModal = useSetAtom(modalState);

  return (
    <SettingSurface>
      <h1>{t('accountSettings.safety.title')}</h1>

      <h2>{t('accountSettings.general.authentication')}</h2>

      <Flex gap={2}>
        <Button
          variant="subtle"
          onClick={() => {
            setModal({
              elem: <PasswordChangeModal />,
            });
          }}
        >
          {t('accountSettings.general.changePassword')}
        </Button>
        <Button
          colorPalette="yellow"
          type="submit"
          height="auto"
          blockSize="auto"
        >
          {t('accountSettings.general.logOutOfAllDevices')}
        </Button>
      </Flex>
      <h2>{t('accountSettings.general.dangerous')}</h2>
      <Box pb="16px">
        Warning: This action is irreversible. You will lose all your data.
      </Box>
      <Flex gap={2}>
        <Button colorPalette="red">
          {t('accountSettings.general.deleteAccount')}
        </Button>
      </Flex>
    </SettingSurface>
  );
}
