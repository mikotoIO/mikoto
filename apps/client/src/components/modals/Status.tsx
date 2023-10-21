import { Button, Form, Heading, Input, Modal } from '@mikoto-io/lucid';
import { useForm } from 'react-hook-form';
import { useSetRecoilState } from 'recoil';

import { modalState } from '../ContextMenu';

export function SetStatusModal() {
  const setModalState = useSetRecoilState(modalState);
  const form = useForm();

  return (
    <Modal>
      <Heading>Set Status</Heading>
      <Form
        onSubmit={form.handleSubmit((data) => {
          console.log(data);
          setModalState(null);
        })}
      >
        <Input labelName="Your Status" {...form.register('status')} />
        <Button variant="primary" type="submit">
          Set status
        </Button>
        <Button type="button">Clear Status</Button>
      </Form>
    </Modal>
  );
}
