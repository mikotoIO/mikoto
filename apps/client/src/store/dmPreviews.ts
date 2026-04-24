import { MessageExt, MikotoClient } from '@mikoto-io/mikoto.js';
import { proxy } from 'valtio/vanilla';

export interface DmPreview {
  content: string;
  timestamp: string;
  authorId: string | null;
  authorName: string | null;
  hasAttachments: boolean;
}

export const dmPreviewStore = proxy<{ previews: Record<string, DmPreview> }>({
  previews: {},
});

function toPreview(msg: MessageExt): DmPreview {
  return {
    content: msg.content,
    timestamp: msg.timestamp,
    authorId: msg.authorId ?? null,
    authorName: msg.author?.name ?? null,
    hasAttachments: (msg.attachments?.length ?? 0) > 0,
  };
}

export function setDmPreview(channelId: string, msg: MessageExt) {
  const existing = dmPreviewStore.previews[channelId];
  if (existing) {
    const existingT = new Date(existing.timestamp).getTime();
    const incomingT = new Date(msg.timestamp).getTime();
    if (incomingT < existingT) return;
  }
  dmPreviewStore.previews[channelId] = toPreview(msg);
}

export function updateDmPreview(channelId: string, msg: MessageExt) {
  const existing = dmPreviewStore.previews[channelId];
  if (!existing || existing.timestamp === msg.timestamp) {
    dmPreviewStore.previews[channelId] = toPreview(msg);
  }
}

export function clearDmPreview(channelId: string) {
  delete dmPreviewStore.previews[channelId];
}

export async function loadDmPreviews(
  mikoto: MikotoClient,
  channelIds: string[],
) {
  await Promise.allSettled(
    channelIds.map(async (channelId) => {
      if (dmPreviewStore.previews[channelId]) return;
      const channel = mikoto.channels._get(channelId);
      if (!channel) return;
      const msgs = await channel.listMessages(1, null);
      const last = msgs[msgs.length - 1];
      if (last) {
        setDmPreview(channelId, last);
      }
    }),
  );
}
