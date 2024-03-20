import { Button } from '@chakra-ui/react';
import { Modal } from '@mikoto-io/lucid';
import { Invite, Space } from 'mikotojs';
import { useState } from 'react';
import styled from 'styled-components';

import { env } from '../../env';
import { useMikoto } from '../../hooks';

const InviteModalWrapper = styled.div`
  .invite-link {
    width: 100%;
    font-size: 14px;
    border-radius: 4px;
    display: block;
    padding: 16px;
    margin-bottom: 8px;
    border: none;
    color: var(--N0);
    background-color: var(--N1000);
    font-family: var(--font-mono);

    &:hover {
      background-color: var(--N1100);
    }
  }
`;

export function InviteModal({ space }: { space: Space }) {
  const [invite, setInvite] = useState<Invite | null>(null);
  const mikoto = useMikoto();
  const link = invite
    ? `${env.PUBLIC_FRONTEND_URL}/invite/${invite.code}`
    : undefined;

  return (
    <Modal style={{ minWidth: '400px' }}>
      <InviteModalWrapper>
        {!invite ? (
          <Button
            variant="primary"
            type="button"
            onClick={() => {
              mikoto.client.spaces
                .createInvite({
                  spaceId: space.id,
                })
                .then((x) => {
                  setInvite(x);
                });
            }}
          >
            Generate
          </Button>
        ) : (
          <>
            <h1>Invite Link</h1>
            <button
              className="invite-link"
              type="button"
              onClick={() => {
                // copy to clipboard
                navigator.clipboard.writeText(link ?? '');
              }}
            >
              {link}
            </button>
            <Button
              type="button"
              variant="primary"
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
      </InviteModalWrapper>
    </Modal>
  );
}
