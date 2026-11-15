import { Invite, MikotoSpace } from '@mikoto-io/mikoto.js';
import { Share2 } from 'lucide-react';
import { useState } from 'react';

import { CopyField } from '@/components/surfaces/settings/common';
import { Button, DialogClose, DialogContent, Field } from '@/design';
import { env } from '@/env';
import { useMikoto } from '@/hooks';
import { useErrorElement } from '@/hooks/useErrorElement';

export function InviteModal({ space }: { space: MikotoSpace }) {
  const [invite, setInvite] = useState<Invite | null>(null);
  const [creating, setCreating] = useState(false);
  const mikoto = useMikoto();
  const error = useErrorElement();
  const link = invite ? `${env.PUBLIC_FRONTEND_URL}/invite/${invite.id}` : null;
  const canShare = typeof navigator.share === 'function';

  const create = async () => {
    setCreating(true);
    error.setError(null);
    try {
      setInvite(
        await mikoto.rest['invites.create'](
          {},
          { params: { spaceId: space.id } },
        ),
      );
    } catch (e) {
      error.setError(e);
    } finally {
      setCreating(false);
    }
  };

  return (
    <DialogContent
      size="sm"
      title={`Invite people to ${space.name}`}
      description={
        link
          ? 'Anyone with this link can join. You can delete it later in space settings.'
          : 'Create a link that anyone can use to join this space.'
      }
      footer={
        link ? (
          <>
            {canShare && (
              <Button
                onClick={() => {
                  navigator
                    .share({ title: `Join ${space.name} on Mikoto`, url: link })
                    .catch(() => {
                      // Share sheet dismissed: nothing to do.
                    });
                }}
              >
                <Share2 size={15} aria-hidden />
                Share
              </Button>
            )}
            <DialogClose render={<Button variant="primary" />}>
              Done
            </DialogClose>
          </>
        ) : (
          <>
            <DialogClose render={<Button variant="ghost" />}>
              Cancel
            </DialogClose>
            <Button variant="primary" loading={creating} onClick={create}>
              Create invite link
            </Button>
          </>
        )
      }
    >
      {error.el}
      {link && (
        <Field label="Invite link">
          <CopyField value={link} what="Invite link" />
        </Field>
      )}
    </DialogContent>
  );
}
