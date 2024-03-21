import {
  Box,
  Button,
  ButtonGroup,
  FormControl,
  FormLabel,
  Input,
  ModalContent,
} from '@chakra-ui/react';
import { faCog, faCopy, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAsync } from 'react-async-hook';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useSetRecoilState } from 'recoil';
import styled from 'styled-components';

import { useAuthClient } from '../../../hooks';
import { useTabkit } from '../../../store/surface';
import { SettingsView } from '../../../views/SettingsViewTemplate';
import { modalState } from '../../ContextMenu';
import { Form } from '../../atoms';
import { Avatar } from '../../atoms/Avatar';

const BotCardContainer = styled.div`
  background-color: var(--N1000);
  display: flex;
  gap: 16px;
  margin: 16px 0 0;
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
  const tabkit = useTabkit();
  return (
    <BotCardContainer>
      <Avatar size={64} />
      <Box>
        <h2>{name}</h2>
        {/* <p>Bot ID: {id}</p> */}
        <ButtonGroup>
          <Button
            onClick={() => {
              tabkit.openTab(
                {
                  kind: 'botSettings',
                  botId: id,
                  key: id,
                },
                true,
              );
            }}
            variant="primary"
            type="button"
          >
            <FontAwesomeIcon icon={faCog} /> Manage Bot
          </Button>
          <Button
            onClick={() => {
              navigator.clipboard.writeText(`${id}:${secret}`);
              toast.success('Copied bot token to clipboard!');
            }}
            type="button"
          >
            <FontAwesomeIcon icon={faCopy} /> Copy Bot Token
          </Button>
          <Button type="button" variant="danger">
            <FontAwesomeIcon icon={faTrash} /> Delete Bot
          </Button>
        </ButtonGroup>
      </Box>
    </BotCardContainer>
  );
}

function BotCreateModal() {
  const authClient = useAuthClient();
  const { register, handleSubmit } = useForm();
  const setModal = useSetRecoilState(modalState);

  return (
    <ModalContent rounded="md" p={4} maxW="480px">
      <Form
        onSubmit={handleSubmit(async (form) => {
          await authClient.createBot(form.name);
          setModal(null);
        })}
      >
        <h1>Create Bot</h1>
        <FormControl>
          <FormLabel>Bot Name</FormLabel>
          <Input {...register('name', { required: true })} />
        </FormControl>
        <Button variant="primary" type="submit">
          Create Bot
        </Button>
      </Form>
    </ModalContent>
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
