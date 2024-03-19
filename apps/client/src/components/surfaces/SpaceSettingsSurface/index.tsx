import { Button, FormControl, FormLabel, Input } from '@chakra-ui/react';
import { Buttons, Form, Modal } from '@mikoto-io/lucid';
import { ClientSpace } from 'mikotojs';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSetRecoilState } from 'recoil';

import { uploadFile } from '../../../functions/fileUpload';
import { useMikoto } from '../../../hooks';
import { SettingsView } from '../../../views/SettingsViewTemplate';
import { modalState } from '../../ContextMenu';
import { AvatarEditor } from '../../molecules/AvatarEditor';
import { BaseSettingsSurface } from '../BaseSettingSurface';
import { BansSubsurface } from './Bans';
import { EmojiSubsurface } from './Emojis';
import { Invites } from './Invites';
import { RolesSubsurface } from './Roles';

function AddBotModal({ space }: { space: ClientSpace }) {
  const form = useForm();
  const mikoto = useMikoto();
  const setModal = useSetRecoilState(modalState);
  return (
    <Modal>
      <Form
        onSubmit={form.handleSubmit(async (data) => {
          await mikoto.client.members.create({
            spaceId: space.id,
            userId: data.botId,
          });
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
    </Modal>
  );
}

const Overview = observer(({ space }: { space: ClientSpace }) => {
  const { t } = useTranslation();
  const [spaceName, setSpaceName] = useState(space.name);
  const setModal = useSetRecoilState(modalState);

  return (
    <SettingsView>
      <Form>
        <h1>{t('spaceSettings.spaceOverview')}</h1>
        <AvatarEditor
          avatar={space.icon ?? undefined}
          onDrop={async (file) => {
            const { data } = await uploadFile('/spaceicon', file);

            await space.update({
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

        <Buttons>
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
        </Buttons>
        <h2>Dangerous</h2>
        <Buttons>
          <Button variant="danger">Delete Space</Button>
        </Buttons>
      </Form>
    </SettingsView>
  );
});

function Switch({ nav, space }: { nav: string; space: ClientSpace }) {
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
  const space = mikoto.spaces.get(spaceId)!;

  return (
    <BaseSettingsSurface
      defaultNav="overview"
      categories={SPACE_SETTING_CATEGORIES}
      switcher={(nav) => <Switch space={space} nav={nav} />}
    />
  );
}
