import { Box, Button } from '@chakra-ui/react';
import { Invite, Space } from 'mikotojs';
import { useEffect, useState } from 'react';

import { useMikoto } from '@/hooks';

import { SettingsView } from '../../../views/SettingsViewTemplate';

export function Invites({ space }: { space: Space }) {
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
          <Box key={invite.code} bg="gray.800" m={1} p={4} rounded="md">
            <Box bg="gray.900" p={2} rounded="md">
              {invite.code}
            </Box>
            <Button
              variant="danger"
              onClick={async () => {
                await mikoto.client.spaces.deleteInvite({
                  spaceId: space.id,
                  inviteCode: invite.code,
                });

                setInvites(invites.filter((x) => x.code !== invite.code));
              }}
            >
              Delete
            </Button>
          </Box>
        ))}
    </SettingsView>
  );
}
