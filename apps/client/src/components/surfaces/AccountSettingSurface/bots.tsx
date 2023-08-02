import { Button, Form, Input, Modal } from '@mikoto-io/lucid';
import { useAsync } from 'react-async-hook';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSetRecoilState } from 'recoil';
import styled from 'styled-components';

import { useAuthClient } from '../../../hooks';
import { SettingsView } from '../../../views/SettingsViewTemplate';
import { modalState } from '../../ContextMenu';
import { TabName } from '../../TabBar';

const BotCardContainer = styled.div`
  background-color: var(--N1000);
  margin: 16px 0;
  padding: 16px;
  border-radius: 8px;
  width: 800px;
  max-width: 100%;
  box-sizing: border-box;
`;

interface BotProps {
  id: string;
  name: string;
  secret: string;
}

function BotCard({ id, name, secret }: BotProps) {
  return (
    <BotCardContainer>
      <h2>{name}</h2>
      <p>Bot ID: {id}</p>
      <Button
        onClick={() => {
          navigator.clipboard.writeText(`${id}:${secret}`);
        }}
      >
        Copy ID:Secret Pair
      </Button>
    </BotCardContainer>
  );
}

function BotCreateModal() {
  const authClient = useAuthClient();
  const { register, handleSubmit } = useForm();
  const setModal = useSetRecoilState(modalState);

  return (
    <Modal>
      <Form
        onSubmit={handleSubmit(async (form) => {
          await authClient.createBot(form.name);
          setModal(null);
        })}
      >
        <h1>Create Bot</h1>
        <Input labelName="Bot Name" {...register('name', { required: true })} />
        <Button variant="primary" type="submit">
          Create Bot
        </Button>
      </Form>
    </Modal>
  );
}

export function BotsSurface() {
  const authClient = useAuthClient();
  const setModal = useSetRecoilState(modalState);
  const { t } = useTranslation();

  const { result: bots } = useAsync(() => authClient.listBots(), []);

  return (
    <SettingsView>
      <h1>{t('accountSettings.bots.title')}</h1>
      <Button
        variant="primary"
        onClick={() => {
          setModal({
            elem: <BotCreateModal />,
          });
        }}
      >
        {t('accountSettings.bots.createBot')}{' '}
      </Button>
      {bots && bots.map((bot) => <BotCard key={bot.id} {...bot} />)}
    </SettingsView>
  );
}
