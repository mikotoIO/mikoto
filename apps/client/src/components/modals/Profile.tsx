import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Buttons, Flex, Modal } from '@mikoto-io/lucid';
import { User } from 'mikotojs';
import { useSetRecoilState } from 'recoil';
import styled from 'styled-components';

import { useMikoto } from '../../hooks';
import { treebarSpaceState } from '../../store';
import { modalState } from '../ContextMenu';
import { Avatar } from '../atoms/Avatar';
import { Tag } from '../atoms/BotTag';

const ProfileContainer = styled.div`
  width: 640px;
  height: 480px;

  .banner {
    background-color: var(--N1000);
    padding: 16px;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
    height: 100px;
  }
  .content {
    padding: 48px 16px 16px;
  }

  h1 {
    font-size: 24px;
    margin-bottom: 0;
  }

  h2 {
    font-size: 20px;
  }

  .mikotoid {
    margin-top: 0;
    font-size: 14px;
    font-family: var(--font-code);
    color: var(--N400);
  }

  ${Tag} {
    font-size: 12px;
  }

  ${Avatar} {
    transform: translateY(50%);
  }
`;

export function ProfileModal({ user }: { user: User }) {
  const mikoto = useMikoto();
  const setSpace = useSetRecoilState(treebarSpaceState);
  const setModal = useSetRecoilState(modalState);

  return (
    <Modal style={{ padding: 0 }}>
      <ProfileContainer>
        <div className="banner">
          <Avatar src={user.avatar ?? undefined} size={100} />
        </div>
        <div className="content">
          <Flex justifyContent="space-between">
            <div>
              <h1>{user.name}</h1>
              <h2 className="mikotoid">@cactus.mikoto.io</h2>
            </div>
            <div>
              {mikoto.me.id !== user.id && (
                <Buttons>
                  <Button
                    variant="success"
                    onClick={async () => {
                      await mikoto.client.relations.openDm({
                        relationId: '2a36685a-6236-4fbe-92bf-b3025fd92cfb',
                      });

                      setModal(null);
                    }}
                  >
                    Send Friend Request
                  </Button>
                  <Button
                    onClick={async () => {
                      const dm = await mikoto.client.relations.openDm({
                        relationId: user.id,
                      });
                      const spaceId = dm.space?.id;
                      if (spaceId) {
                        setSpace({
                          kind: 'explorer',
                          key: `explorer/${spaceId}`,
                          spaceId,
                        });
                      }
                      setModal(null);
                    }}
                  >
                    <FontAwesomeIcon icon={faEnvelope} />
                  </Button>
                </Buttons>
              )}
            </div>
          </Flex>
          <h2>Bio</h2>
          <p>Bio Should go here. Lorem ipsum dolor sit amet consectetur.</p>
        </div>
      </ProfileContainer>
    </Modal>
  );
}
