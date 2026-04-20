import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import { MikotoChannel } from '@mikoto-io/mikoto.js';

import { useMikoto } from '@/hooks';

import { SyncState, useProviderFactory } from '../providerFactory';

export interface CollabPluginProps {
  channel: MikotoChannel;
  content: string;
  onSync?: () => void;
}

export function CollabPlugin({ channel, content, onSync }: CollabPluginProps) {
  const mikoto = useMikoto();
  const { providerFactory } = useProviderFactory({
    channel,
    content,
    onSync,
  });

  return (
    <CollaborationPlugin
      id={channel.id}
      providerFactory={providerFactory}
      shouldBootstrap={true}
      username={mikoto.user.me?.name}
    />
  );
}

export type { SyncState };
