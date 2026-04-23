import { Button, Input } from '@chakra-ui/react';
import { Heading } from '@chakra-ui/react';
import { AxiosError } from 'axios';
import { useSetAtom } from 'jotai';
import { useForm } from 'react-hook-form';



import { modalState } from '@/components/ContextMenu';
import { Field } from '@/components/ui';
import { DialogContent } from '@/components/ui';
import { useMikoto } from '@/hooks';
import { useErrorElement } from '@/hooks/useErrorElement';
import { Form } from '@/ui';


function SpaceCreateForm({ closeModal }: { closeModal: () => void }) {
  const mikoto = useMikoto();
  const form = useForm();

  return (
    <Form
      onSubmit={form.handleSubmit(async (data) => {
        await mikoto.rest['spaces.create']({ name: data.spaceName });
        closeModal();
        form.reset();
      })}
    >
      <Field label="Space Name">
        <Input
          autoComplete="off"
          placeholder="Academy City"
          {...form.register('spaceName')}
        />
      </Field>
      <Button colorPalette="primary" type="submit">
        Create Space
      </Button>
    </Form>
  );
}

function SpaceJoinForm({ closeModal }: { closeModal: () => void }) {
  const mikoto = useMikoto();



  const { register, handleSubmit, reset } = useForm();
  const error = useErrorElement();
  return (
    <Form
      onSubmit={handleSubmit(async (data) => {
        try {
          await mikoto.rest['spaces.join'](undefined, {
            params: { invite: data.inviteCode },
          });
          closeModal();
          reset();
        } catch (e) {
          error.setError((e as AxiosError).response?.data as any);
        }
      })}
    >
      {error.el}
      <Field label="Invite Link/Code">
        <Input autoComplete="off" {...register('inviteCode')} />
      </Field>
      <Button type="submit">Join Space</Button>
    </Form>
  );
}

export function SpaceJoinModal() {
  const setModal = useSetAtom(modalState);

  return (
    <DialogContent rounded="md" p={4} maxW="480px">
      <Heading mt={0} textAlign="center">
        Create a Space
      </Heading>
      <SpaceCreateForm
        closeModal={() => {
          setModal(null);
        }}
      />
      <Heading mt={6} textAlign="center">
        Have an invite already?
      </Heading>
      <SpaceJoinForm
        closeModal={() => {
          setModal(null);
        }}
      />
    </DialogContent>
  );
}