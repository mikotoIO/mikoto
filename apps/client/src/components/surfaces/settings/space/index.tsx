import {
  Button,
  ButtonGroup,
  FormControl,
  FormLabel,
  Input,
  ModalContent,
} from '@chakra-ui/react';
import { MikotoSpace } from '@mikoto-io/mikoto.js';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSetRecoilState } from 'recoil';

import { modalState } from '@/components/ContextMenu';
import { AvatarEditor } from '@/components/molecules/AvatarEditor';
import { BaseSettingsSurface } from '@/components/surfaces/BaseSettings';
import { uploadFile } from '@/functions/fileUpload';
import { useMikoto } from '@/hooks';
import { Form } from '@/ui';
import { SettingSurface } from '@/views';

import { BansSubsurface } from './Bans';
import { EmojiSubsurface } from './Emojis';
import { Invites } from './Invites';
import { RolesSubsurface } from './Roles';

function AddBotModal({ space }: { space: MikotoSpace }) {
  const form = useForm();
  const mikoto = useMikoto();
  const setModal = useSetRecoilState(modalState);
  return (
    <ModalContent rounded="md" p={4} maxW="480px">
      <Form
        onSubmit={form.handleSubmit(async (data) => {
          await mikoto.rest['members.create'](
            {
              userId: data.botId,
            },
            {
              params: {
                spaceId: space.id,
              },
            },
          );
          setModal(null);
        })}
      >
        <FormControl>
          <FormLabel>Bot ID</FormLabel>
          <Input {...form.register('botId')} />
        </FormControl>
        <Button type="submit" variant="primary">
          Submit
        </Button>
      </Form>
    </ModalContent>
  );
}

const Overview = observer(({ space }: { space: MikotoSpace }) => {
  const { t } = useTranslation();
  const [spaceName, setSpaceName] = useState(space.name);
  const setModal = useSetRecoilState(modalState);

  return (
    <SettingSurface>
      <Form>
        <h1>{t('spaceSettings.spaceOverview')}</h1>
        <AvatarEditor
          avatar={space.icon ?? undefined}
          onDrop={async (file) => {
            const { data } = await uploadFile('/spaceicon', file);

            await space.edit({
              icon: data.url,
              name: null,
            });
          }}
        />

        <FormControl>
          <FormLabel>Space Name</FormLabel>
          <Input
            value={spaceName}
            onChange={(x) => setSpaceName(x.target.value)}
          />
        </FormControl>

        <ButtonGroup>
          <Button
            variant="primary"
            type="button"
            onClick={() => {
              // TODO: Implement Space Update
            }}
          >
            Update
          </Button>
          <Button
            type="button"
            onClick={(e) => {
              setModal({
                elem: <AddBotModal space={space} />,
              });
              e.preventDefault();
            }}
          >
            Add Bot
          </Button>
        </ButtonGroup>
        <h2>Dangerous</h2>
        <ButtonGroup>
          <Button variant="danger">Delete Space</Button>
        </ButtonGroup>
      </Form>
    </SettingSurface>
  );
});

function Switch({ nav, space }: { nav: string; space: MikotoSpace }) {
  switch (nav) {
    case 'overview':
      return <Overview space={space} />;
    case 'invites':
      return <Invites space={space} />;
    case 'roles':
      return <RolesSubsurface space={space} />;
    case 'emojis':
      return <EmojiSubsurface />;
    case 'bans':
      return <BansSubsurface />;
    default:
      return null;
  }
}

const SPACE_SETTING_CATEGORIES = [
  { code: 'overview', tkey: 'spaceSettings.overview.title' },
  { code: 'invites', tkey: 'spaceSettings.invites.title' },
  { code: 'roles', tkey: 'spaceSettings.roles.title' },
  { code: 'emojis', tkey: 'spaceSettings.emojis.title' },
  { code: 'bans', tkey: 'spaceSettings.bans.title' },
];

export function SpaceSettingsSurface({ spaceId }: { spaceId: string }) {
  const mikoto = useMikoto();
  const space = mikoto.spaces._get(spaceId)!;

  return (
    <BaseSettingsSurface
      defaultNav="overview"
      categories={SPACE_SETTING_CATEGORIES}
      switcher={(nav) => <Switch space={space} nav={nav} />}
    />
  );
}
