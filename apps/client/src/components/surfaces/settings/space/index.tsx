import { Button, Group, Input } from '@chakra-ui/react';
import { MikotoSpace } from '@mikoto-io/mikoto.js';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSetRecoilState } from 'recoil';
import { useSnapshot } from 'valtio';

import { modalState } from '@/components/ContextMenu';
import { AvatarEditor } from '@/components/molecules/AvatarEditor';
import { BaseSettingsSurface } from '@/components/surfaces/BaseSettings';
import { DialogContent, Field } from '@/components/ui';
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
    <DialogContent rounded="md" p={4} maxW="480px">
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
        <Field label="Bot ID">
          <Input {...form.register('botId')} />
        </Field>
        <Button type="submit" colorPalette="primary">
          Submit
        </Button>
      </Form>
    </DialogContent>
  );
}

function Overview({ space }: { space: MikotoSpace }) {
  const { t } = useTranslation();
  const [spaceName, setSpaceName] = useState(space.name);
  const setModal = useSetRecoilState(modalState);
  const spaceSnap = useSnapshot(space);

  return (
    <SettingSurface>
      <Form>
        <h1>{t('spaceSettings.spaceOverview')}</h1>
        <AvatarEditor
          avatar={spaceSnap.icon ?? undefined}
          onDrop={async (file) => {
            const { data } = await uploadFile('/spaceicon', file);

            await space.edit({
              icon: data.url,
              name: null,
            });
          }}
        />

        <Field label="Space Name">
          <Input
            value={spaceName}
            onChange={(x) => setSpaceName(x.target.value)}
          />
        </Field>

        <Group>
          <Button
            colorPalette="primary"
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
        </Group>
        <h2>Dangerous</h2>
        <Group>
          <Button colorPalette="danger">Delete Space</Button>
        </Group>
      </Form>
    </SettingSurface>
  );
}

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
