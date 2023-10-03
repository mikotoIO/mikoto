import { Input, Form, Button, Buttons, Modal, Box } from '@mikoto-io/lucid';
import { ClientSpace, Invite, Space } from 'mikotojs';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSetRecoilState } from 'recoil';

import { useMikoto } from '../../../hooks';
import { SettingsView } from '../../../views/SettingsViewTemplate';
import { modalState } from '../../ContextMenu';
import { TabName } from '../../TabBar';
import {
  AvatarEditor,
  mediaServerAxios,
  uploadFileWithAxios,
} from '../../molecules/AvatarEditor';
import { BaseSettingsSurface } from '../BaseSettingSurface';
import { EmojiSubsurface } from './Emojis';
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
        <Input labelName="Bot ID" {...form.register('botId')} />
        <Button type="submit">Submit</Button>
      </Form>
    </Modal>
  );
}

function Overview({ space }: { space: ClientSpace }) {
  const { t } = useTranslation();
  const [spaceName, setSpaceName] = useState(space.name);
  const mikoto = useMikoto();
  const setModal = useSetRecoilState(modalState);

  return (
    <SettingsView>
      <TabName
        name={t('spaceSettings.settingsForSpace', {
          name: space.name,
        })}
      />
      <Form>
        <h1>{t('spaceSettings.spaceOverview')}</h1>
        <AvatarEditor
          avatar={space.icon ?? undefined}
          onDrop={async (file) => {
            const { data } = await uploadFileWithAxios<{ url: string }>(
              mediaServerAxios,
              '/spaceicon',
              file,
            );

            await space.update({
              icon: data.url,
              name: null,
            });
          }}
        />

        <Input
          labelName="Space Name"
          value={spaceName}
          onChange={(x) => setSpaceName(x.target.value)}
        />
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
}

function Invites({ space }: { space: Space }) {
  const mikoto = useMikoto();
  const [invites, setInvites] = useState<Invite[] | null>(null);

  useEffect(() => {
    mikoto.client.spaces.listInvites({ spaceId: space.id }).then((x) => {
      setInvites(x);
    });
  }, [space.id]);

  return (
    <SettingsView>
      <h1>Invites</h1>
      {invites &&
        invites.map((invite) => (
          <Box key={invite.code} bg="N900" m={4} p={16} rounded={8}>
            <Box bg="N1000" p={8} rounded={8}>
              {invite.code}
            </Box>
            <Button
              variant="danger"
              onClick={() => {
                mikoto.client.spaces
                  .deleteInvite({ spaceId: space.id, inviteCode: invite.code })
                  .then(() => {
                    setInvites(invites.filter((x) => x.code !== invite.code));
                  });
              }}
            >
              Delete
            </Button>
          </Box>
        ))}
    </SettingsView>
  );
}

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
    default:
      return null;
  }
}

const SPACE_SETTING_CATEGORIES = [
  { code: 'overview', tkey: 'spaceSettings.overview.title' },
  { code: 'invites', tkey: 'spaceSettings.invites.title' },
  { code: 'roles', tkey: 'spaceSettings.roles.title' },
  { code: 'emojis', tkey: 'spaceSettings.emojis.title' },
];

export function SpaceSettingsView({ spaceId }: { spaceId: string }) {
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
