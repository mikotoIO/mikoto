import { Button, Form, Heading, Input, Modal } from '@mikoto-io/lucid';

export function SetStatusModal() {
  return (
    <Modal>
      <Heading>Set Current Status</Heading>
      <Form>
        <Input labelName="Your Status" />
        <Button variant="primary">Set status</Button>
      </Form>
    </Modal>
  );
}
