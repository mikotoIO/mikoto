import { Box, Button } from '@chakra-ui/react';
import { Invite, SpaceExt } from 'mikotojs';
import { useEffect, useState } from 'react';

import { useMikoto } from '@/hooks';
import { SettingSurface } from '@/views';

export function Invites({ space }: { space: SpaceExt }) {
  const mikoto = useMikoto();
  const [invites, setInvites] = useState<Invite[] | null>(null);

  useEffect(() => {
    mikoto.api['invites.list']({
      params: { spaceId: space.id },
    }).then((x) => {
      setInvites(x);
    });
  }, [space.id]);

  return (
    <SettingSurface>
      <h1>Invites</h1>
      {invites &&
        invites.map((invite) => (
          <Box key={invite.id} bg="gray.800" m={1} p={4} rounded="md">
            <Box bg="gray.900" p={2} rounded="md">
              {invite.id}
            </Box>
            <Button
              variant="danger"
              onClick={async () => {
                await mikoto.api['invites.delete'](undefined, {
                  params: { spaceId: space.id, inviteId: invite.id },
                });

                setInvites(invites.filter((x) => x.id !== invite.id));
              }}
            >
              Delete
            </Button>
          </Box>
        ))}
    </SettingSurface>
  );
}
