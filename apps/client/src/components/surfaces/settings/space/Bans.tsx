import { Box, Button } from '@chakra-ui/react';
import { type BanInfo } from '@mikoto-io/mikoto.js';
import { useEffect, useState } from 'react';

import { Avatar } from '@/components/atoms/Avatar';
import { useMikoto } from '@/hooks';
import { SettingSurface } from '@/views';

export const BansSubsurface = (props: { spaceId: string }) => {
  const { spaceId } = props;
  const mikoto = useMikoto();
  const [bans, setBans] = useState<BanInfo[] | null>(null);

  useEffect(() => {
    mikoto.rest['bans.list']({
      params: { spaceId: spaceId },
    }).then((x) => {
      setBans(x);
    });
  }, [spaceId]);

  return (
    <SettingSurface>
      <h1>Bans</h1>
      {!bans ? (
        <p>Loading...</p>
      ) : bans.length === 0 ? (
        <p>No bans yet :)</p>
      ) : (
        bans.map((ban) => (
          <Box
            key={ban.id}
            bg="gray.800"
            m={1}
            p={4}
            rounded="md"
            display="flex"
            gap={2}
          >
            {ban.user && (
              <Box
                display="flex"
                alignItems="center"
                bg="gray.900"
                rounded="md"
              >
                <Avatar
                  size={40}
                  src={ban.user.avatar ?? undefined}
                  userId={ban.user.id}
                />
                <Box p={2}>{ban.user.name}</Box>
              </Box>
            )}
            {ban.reason && (
              <Box p={2} color="gray.500">
                reason: {ban.reason}
              </Box>
            )}
            <Button
              colorPalette="danger"
              onClick={async () => {
                await mikoto.rest['bans.delete'](undefined, {
                  params: { spaceId: spaceId, userId: ban.userId },
                });

                setBans(bans.filter((x) => x.id !== ban.id));
              }}
            >
              Unban
            </Button>
          </Box>
        ))
      )}
    </SettingSurface>
  );
};
