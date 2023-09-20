import { Button, Form, Heading, Input, Modal } from '@mikoto-io/lucid';
import { useSetRecoilState } from 'recoil';

import { modalState } from '../ContextMenu';

export function SetStatusModal() {
  const setModalState = useSetRecoilState(modalState);

  return (
    <Modal>
      <Heading>Set Current Status</Heading>
      <Form>
        <Input labelName="Your Status" />
        <Button
          variant="primary"
          type="button"
          onClick={() => {
            setModalState(null);
          }}
        >
          Set status
        </Button>
        <Button type="button">Clear Status</Button>
      </Form>
    </Modal>
  );
}
