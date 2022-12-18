import { ClientMember, useMikoto } from 'mikotojs';
import React, { useRef, useState } from 'react';
import { useSetRecoilState } from 'recoil';
import styled from 'styled-components';

import { User } from '../../models';
import { contextMenuState } from '../ContextMenu';

const AvatarImg = styled.img<{ size: number }>`
  user-select: none;
  width: ${(p) => p.size}px;
  height: ${(p) => p.size}px;
  border-radius: 8px;
`;

interface AvatarProps {
  src?: string;
  size?: number;
}

export function Avatar({ src, size }: AvatarProps) {
  return (
    <AvatarImg src={src ?? '/images/default_avatar.png'} size={size ?? 40} />
  );
}

const AvatarContextWrapper = styled.div`
  position: relative;
  background-color: ${(p) => p.theme.colors.N1100};
  color: white;
  padding: 16px;
  border-radius: 4px;
  width: 300px;

  h1 {
    font-size: 20px;
    margin-top: 0;
  }
  hr {
    opacity: 0.1;
  }
  h2 {
    font-size: 16px;
  }
`;

function AvatarContextMenu({ user, spaceId }: { user: User; spaceId: string }) {
  const mikoto = useMikoto();
  const [member, setMember] = useState<ClientMember | null>(null);
  React.useEffect(() => {
    mikoto.getMember(spaceId, user.id).then((m) => setMember(m));
  }, [user.id]);

  return (
    <AvatarContextWrapper>
      {member === null ? (
        'loading'
      ) : (
        <div>
          <Avatar src={user.avatar} size={80} />
          <h1>{user.name}</h1>
          <hr />
          <h2>Roles</h2>
          <div>{JSON.stringify(member.roleIds)}</div>
        </div>
      )}
    </AvatarContextWrapper>
  );
}

interface MessageAvatarProps extends AvatarProps {
  user?: User;
  spaceId: string;
}

export function MessageAvatar({
  src,
  user,
  size,
  spaceId,
}: MessageAvatarProps) {
  const setContextMenu = useSetRecoilState(contextMenuState);
  const avatarRef = useRef<HTMLImageElement>(null);

  return (
    <AvatarImg
      src={src ?? '/images/default_avatar.png'}
      size={size ?? 40}
      ref={avatarRef}
      onClick={(ev) => {
        if (!user) return;
        ev.preventDefault();
        ev.stopPropagation();
        if (avatarRef.current === null) return;
        const { top, right } = avatarRef.current.getBoundingClientRect();

        setContextMenu({
          position: { top, left: right + 8 },
          elem: <AvatarContextMenu user={user} spaceId={spaceId} />,
        });
      }}
    />
  );
}
