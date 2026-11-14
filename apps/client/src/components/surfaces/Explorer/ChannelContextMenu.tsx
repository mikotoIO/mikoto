import {
  Channel,
  ChannelType,
  MikotoChannel,
  MikotoSpace,
} from '@mikoto-io/mikoto.js';
import { permissions } from '@mikoto-io/permcheck';
import { useSetAtom } from 'jotai';
import {
  CheckCheck,
  FileText,
  FolderPlus,
  Hash,
  Link,
  type LucideIcon,
  Settings,
  SquareArrowOutUpRight,
  Trash2,
  Volume2,
} from 'lucide-react';
import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';

import { ContextMenu, modalState } from '@/components/ContextMenu';
import {
  Button,
  DialogClose,
  DialogContent,
  Field,
  Form,
  Input,
  describeError,
  toast,
} from '@/design';
import { useTabkit } from '@/store/surface';
import { ackChannel } from '@/store/unreads';

import styles from './Explorer.module.css';
import { channelToTab } from './channelToTab';

const ICON = 15;

const channelTypes: {
  id: ChannelType;
  name: string;
  hint: string;
  icon: LucideIcon;
}[] = [
  { id: 'TEXT', name: 'Text', hint: 'Messages and threads', icon: Hash },
  { id: 'VOICE', name: 'Voice', hint: 'Talk and share screens', icon: Volume2 },
  {
    id: 'DOCUMENT',
    name: 'Doc',
    hint: 'A page everyone can edit together',
    icon: FileText,
  },
];

export function CreateChannelModal({
  space,
  channel,
}: {
  space: MikotoSpace;
  channel?: Channel;
}) {
  const setModal = useSetAtom(modalState);
  const formId = useId();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ name: string }>();
  const [channelType, setChannelType] = useState<ChannelType>('TEXT');
  const [submitError, setSubmitError] = useState<string | null>(null);

  return (
    <DialogContent
      size="sm"
      title={channel ? 'Create subchannel' : 'Create channel'}
      description={channel ? `Inside #${channel.name}` : `In ${space.name}`}
      footer={
        <>
          <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
          <Button
            variant="primary"
            type="submit"
            form={formId}
            loading={isSubmitting}
          >
            Create channel
          </Button>
        </>
      }
    >
      <Form
        id={formId}
        onSubmit={handleSubmit(async (data) => {
          setSubmitError(null);
          try {
            await space.createChannel({
              name: data.name.trim(),
              type: channelType,
              parentId: channel?.id ?? null,
            });
            setModal(null);
            toast({ type: 'success', title: 'Channel created' });
          } catch (e) {
            setSubmitError(describeError(e, { context: 'action' }).message);
          }
        })}
      >
        <div
          className={styles.typePicker}
          role="radiogroup"
          aria-label="Channel type"
        >
          {channelTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                type="button"
                role="radio"
                aria-checked={channelType === type.id}
                className={styles.typeOption}
                onClick={() => setChannelType(type.id)}
              >
                <Icon size={18} aria-hidden />
                <strong>{type.name}</strong>
                <small>{type.hint}</small>
              </button>
            );
          })}
        </div>
        <Field
          label="Channel name"
          required
          error={errors.name?.message ?? submitError ?? undefined}
        >
          <Input
            autoComplete="off"
            autoFocus
            placeholder="general"
            {...register('name', {
              validate: (v) =>
                v.trim().length > 0 || 'Give the channel a name.',
            })}
          />
        </Field>
      </Form>
    </DialogContent>
  );
}

function DeleteChannelModal({ channel }: { channel: MikotoChannel }) {
  const setModal = useSetAtom(modalState);
  const [deleting, setDeleting] = useState(false);

  return (
    <DialogContent
      size="sm"
      title={`Delete #${channel.name}?`}
      description="The channel and its messages are deleted for everyone. This can't be undone."
      footer={
        <>
          <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
          <Button
            variant="danger"
            loading={deleting}
            onClick={async () => {
              setDeleting(true);
              try {
                await channel.delete();
                setModal(null);
                toast({ type: 'success', title: 'Channel deleted' });
              } catch (err) {
                setDeleting(false);
                toast({
                  type: 'error',
                  title: `Couldn't delete #${channel.name}`,
                  description: describeError(err, { context: 'action' })
                    .message,
                });
              }
            }}
          >
            Delete channel
          </Button>
        </>
      }
    />
  );
}

async function copyText(text: string, success: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast({ type: 'success', title: success });
  } catch {
    toast({
      type: 'error',
      title: "Couldn't copy to the clipboard",
      description: 'Allow clipboard access for this site and try again.',
    });
  }
}

export const ChannelContextMenu = ({ channel }: { channel: MikotoChannel }) => {
  const tabkit = useTabkit();
  const setModal = useSetAtom(modalState);
  const isAdmin = channel.space?.member?.checkPermission(permissions.superuser);

  return (
    <ContextMenu>
      <ContextMenu.Item
        icon={<SquareArrowOutUpRight size={ICON} />}
        onClick={() => {
          tabkit.openTab(channelToTab(channel), true);
        }}
      >
        Open in new tab
      </ContextMenu.Item>
      <ContextMenu.Item
        icon={<CheckCheck size={ICON} />}
        onClick={async () => {
          const now = new Date().toISOString();
          try {
            await channel.ack();
            ackChannel(channel.id, now);
          } catch (err) {
            toast({
              type: 'error',
              title: `Couldn't mark #${channel.name} as read`,
              description: describeError(err, { context: 'action' }).message,
            });
          }
        }}
      >
        Mark as read
      </ContextMenu.Item>
      <ContextMenu.Item
        icon={<Settings size={ICON} />}
        onClick={() => {
          tabkit.openTab(
            {
              kind: 'channelSettings',
              key: `channelSettings/${channel.id}`,
              channelId: channel.id,
            },
            false,
          );
        }}
      >
        Channel settings
      </ContextMenu.Item>
      {isAdmin && (
        <>
          <ContextMenu.Separator />
          <ContextMenu.Item
            icon={<FolderPlus size={ICON} />}
            onClick={() => {
              const { space } = channel;
              if (!space) {
                toast({
                  type: 'error',
                  title: "Couldn't create a subchannel",
                  description:
                    "This channel's space hasn't loaded. Reload and try again.",
                });
                return;
              }
              setModal({
                elem: <CreateChannelModal space={space} channel={channel} />,
              });
            }}
          >
            Create subchannel
          </ContextMenu.Item>
          <ContextMenu.Item
            icon={<Link size={ICON} />}
            onClick={() =>
              copyText(
                `${window.location.origin}/?m=${channel.id}`,
                'Channel link copied',
              )
            }
          >
            Copy channel link
          </ContextMenu.Item>
          <ContextMenu.Separator />
          <ContextMenu.Item
            icon={<Trash2 size={ICON} />}
            danger
            onClick={() => {
              setModal({ elem: <DeleteChannelModal channel={channel} /> });
            }}
          >
            Delete channel
          </ContextMenu.Item>
        </>
      )}
    </ContextMenu>
  );
};
