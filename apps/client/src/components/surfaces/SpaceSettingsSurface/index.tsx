import { Input, Form, Button, Buttons, Modal } from '@mikoto-io/lucid';
import { Space } from 'mikotojs';
import { useState } from 'react';
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
import { EmojiSubsurface } from './Emojis';
import { RolesSubsurface } from './Roles';

function AddBotModal() {
  return (
    <Modal>
      <Form>
        <Input labelName="Bot ID" />
        <Button>Submit</Button>
      </Form>
    </Modal>
  );
}

function Overview({ space }: { space: Space }) {
  const [spaceName, setSpaceName] = useState(space.name);
  const mikoto = useMikoto();
  const setModal = useSetRecoilState(modalState);

  return (
    <SettingsView>
      <TabName name={`Settings for ${space.name}`} />
      <Form>
        <h1>Space Overview</h1>
        <AvatarEditor
          onDrop={async (file) => {
            const { data } = await uploadFileWithAxios<{ url: string }>(
              mediaServerAxios,
              '/spaceicon',
              file,
            );
            await mikoto.client.spaces.update(space.id, {
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
          <Button variant="primary">Update</Button>
          <Button
            role="button"
            onClick={(e) => {
              setModal({
                elem: <AddBotModal />,
              });
              e.preventDefault();
            }}
          >
            Add Bot
          </Button>
        </Buttons>
      </Form>
    </SettingsView>
  );
}

function Invites({ space }: { space: Space }) {
  return (
    <SettingsView>
      <h1>Invites</h1>
    </SettingsView>
  );
}

function SettingSwitch({ nav, space }: { nav: string; space: Space }) {
  switch (nav) {
    case 'Overview':
      return <Overview space={space} />;
    case 'Invites':
      return <Invites space={space} />;
    case 'Roles':
      return <RolesSubsurface space={space} />;
    case 'Emojis':
      return <EmojiSubsurface />;
    default:
      return null;
  }
}

const CATEGORIES = ['Overview', 'Invites', 'Roles', 'Emojis'];

export function SpaceSettingsView({ space }: { space: Space }) {
  const [nav, setNav] = useState('Overview');
  return (
    <SettingsView.Container>
      <SettingsView.Sidebar>
        {CATEGORIES.map((c) => (
          <SettingsView.Nav
            active={nav === c}
            onClick={() => {
              setNav(c);
            }}
            key={c}
          >
            {c}
          </SettingsView.Nav>
        ))}
      </SettingsView.Sidebar>
      <SettingSwitch nav={nav} space={space} />
    </SettingsView.Container>
  );
}
