import { Button, Form, Heading, Input, Modal } from '@mikoto-io/lucid';
import { AxiosError } from 'axios';
import { useForm } from 'react-hook-form';
import { useSetRecoilState } from 'recoil';
import styled from 'styled-components';

import { useMikoto } from '../../hooks';
import { useErrorElement } from '../../hooks/useErrorElement';
import { modalState } from '../ContextMenu';

const SpaceJoinModalWrapper = styled.div`
  min-width: 400px;
  .inviteheader {
    text-align: center;
  }
`;

function SpaceCreateForm({ closeModal }: { closeModal: () => void }) {
  const mikoto = useMikoto();
  const form = useForm();

  return (
    <Form
      onSubmit={form.handleSubmit(async (data) => {
        await mikoto.client.spaces.create({ name: data.spaceName });
        closeModal();
        form.reset();
      })}
    >
      <Input
        labelName="Space Name"
        placeholder="Academy City"
        {...form.register('spaceName')}
      />
      <Button variant="primary" type="submit">
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
          await mikoto.client.spaces.join({
            inviteCode: data.inviteCode,
          });
          closeModal();
          reset();
        } catch (e) {
          error.setError((e as AxiosError).response?.data as any);
        }
      })}
    >
      {error.el}
      <Input labelName="Invite Link/Code" {...register('inviteCode')} />
      <Button>Join Space</Button>
    </Form>
  );
}

export function SpaceJoinModal() {
  const setModal = useSetRecoilState(modalState);

  return (
    <Modal>
      <SpaceJoinModalWrapper>
        <Heading className="inviteheader" m={{ top: 0 }}>
          Create a Space
        </Heading>
        <SpaceCreateForm
          closeModal={() => {
            setModal(null);
          }}
        />
        <h2 className="inviteheader">Have an invite already?</h2>
        <SpaceJoinForm
          closeModal={() => {
            setModal(null);
          }}
        />
      </SpaceJoinModalWrapper>
    </Modal>
  );
}
