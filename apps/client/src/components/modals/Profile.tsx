import { User } from 'mikotojs';
import styled from 'styled-components';

import { DialogPanel } from '../../lucid/DialogPanel';
import { Avatar } from '../atoms/Avatar';
import { BotTag, Tag } from '../atoms/BotTag';

const ProfileContainer = styled.div`
  width: 500px;

  .banner {
    background-color: var(--N1000);
    padding: 16px;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
    height: 100px;
  }
  .content {
    padding: 64px 16px 16px;
  }

  ${Tag} {
    font-size: 12px;
  }

  ${Avatar} {
    transform: translateY(50%);
  }
`;

export function ProfileModal({ user }: { user: User }) {
  return (
    <DialogPanel style={{ padding: 0 }}>
      <ProfileContainer>
        <div className="banner">
          <Avatar src={user.avatar ?? undefined} size={100} />
        </div>
        <div className="content">
          <span>
            <h1>{user.name}</h1>
          </span>
          <p>Bio Should go here. Lorem ipsum dolor sit amet consectetur.</p>
        </div>
      </ProfileContainer>
    </DialogPanel>
  );
}
