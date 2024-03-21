import {
  Button,
  FormControl,
  FormLabel,
  Input,
  ModalContent,
} from '@chakra-ui/react';
import { Heading } from '@chakra-ui/react';
import { AxiosError } from 'axios';
import { useForm } from 'react-hook-form';
import { useSetRecoilState } from 'recoil';
import styled from 'styled-components';

import { useMikoto } from '../../hooks';
import { useErrorElement } from '../../hooks/useErrorElement';
import { modalState } from '../ContextMenu';
import { Form } from '../atoms';

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
      <FormControl>
        <FormLabel>Space Name</FormLabel>
        <Input placeholder="Academy City" {...form.register('spaceName')} />
      </FormControl>
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
      <FormControl>
        <FormLabel>Invite Link/Code</FormLabel>
        <Input {...register('inviteCode')} />
      </FormControl>
      <Button>Join Space</Button>
    </Form>
  );
}

export function SpaceJoinModal() {
  const setModal = useSetRecoilState(modalState);

  return (
    <ModalContent rounded="md" p={4} maxW="480px">
      <SpaceJoinModalWrapper>
        <Heading fontSize="xl" className="inviteheader" mt={0}>
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
    </ModalContent>
  );
}
