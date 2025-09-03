import { Button, DialogContent } from '@chakra-ui/react';
import styled from '@emotion/styled';
import { Invite, MikotoSpace } from '@mikoto-io/mikoto.js';
import { useState } from 'react';

import '@/components/ui';
import { env } from '@/env';
import { useMikoto } from '@/hooks';

const InviteLink = styled.button`
  width: 100%;
  font-size: 14px;
  border-radius: 4px;
  display: block;
  padding: 16px;
  margin-bottom: 8px;
  border: none;
  color: var(--chakra-colors-white);
  background-color: var(--chakra-colors-gray-800);
  font-family: var(--chakra-fonts-code);

  &:hover {
    background-color: var(--chakra-colors-gray-850);
  }
`;

export function InviteModal({ space }: { space: MikotoSpace }) {
  const [invite, setInvite] = useState<Invite | null>(null);
  const mikoto = useMikoto();
  const link = invite
    ? `${env.PUBLIC_FRONTEND_URL}/invite/${invite.id}`
    : undefined;

  return (
    <DialogContent rounded="md" p={4} maxW="400px">
      <div>
        {!invite ? (
          <Button
            colorPalette="primary"
            type="button"
            onClick={() => {
              mikoto.rest['invites.create'](
                {},
                {
                  params: { spaceId: space.id },
                },
              ).then((x) => {
                setInvite(x);
              });
            }}
          >
            Generate
          </Button>
        ) : (
          <>
            <h1>Invite Link</h1>
            <InviteLink
              className="invite-link"
              type="button"
              onClick={() => {
                // copy to clipboard
                navigator.clipboard.writeText(link ?? '');
              }}
            >
              {link}
            </InviteLink>
            <Button
              type="button"
              colorPalette="primary"
              onClick={() => {
                navigator.share({
                  title: `Invite to ${space.name} on Mikoto`,
                  url: link,
                });
              }}
            >
              Share
            </Button>
          </>
        )}
      </div>
    </DialogContent>
  );
}
