import { Button, Heading, Input } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { useSetRecoilState } from 'recoil';

import { modalState } from '@/components/ContextMenu';
import { DialogContent, Field } from '@/components/ui';
import { Form } from '@/ui';

export function SetStatusModal() {
  const setModalState = useSetRecoilState(modalState);
  const form = useForm();

  return (
    <DialogContent rounded="md" p={4} maxW="400px">
      <Heading fontSize="xl">Set Status</Heading>
      <Form
        onSubmit={form.handleSubmit((data) => {
          console.log(data);
          setModalState(null);
        })}
      >
        <Field label="Your Status">
          <Input {...form.register('status')} />
        </Field>

        <Button colorPalette="primary" type="submit">
          Set status
        </Button>
        <Button type="button">Clear Status</Button>
      </Form>
    </DialogContent>
  );
}
