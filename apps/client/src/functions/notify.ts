import { MessageExt, MikotoClient } from '@mikoto-io/mikoto.js';

import { normalizeMediaUrl } from '@/components/atoms/Avatar';

const audio = new Audio('audio/notification/ping.ogg');
audio.volume = 0.3;
audio.load();

const BATCH_WINDOW_MS = 3000;
const BATCH_THRESHOLD = 3;

const recentByChannel = new Map<
  string,
  { count: number; timer: ReturnType<typeof setTimeout> }
>();

let _activeChannelId: string | null = null;

export function setActiveChannelId(channelId: string | null) {
  _activeChannelId = channelId;
}

export function getActiveChannelId() {
  return _activeChannelId;
}

function isSoundEnabled() {
  return localStorage.getItem('notificationSound') !== 'false';
}

function showNotification(title: string, body: string, icon?: string) {
  const notification = new Notification(title, {
    body,
    icon,
    silent: true,
  });
  notification.onshow = () => {
    if (isSoundEnabled()) {
      audio.play();
    }
    setTimeout(() => {
      notification.close();
    }, 3000);
  };
}

/** Returns true if the message was suppressed because the user is viewing the channel. */
export function notifyFromMessage(
  mikoto: MikotoClient,
  message: MessageExt,
): boolean {
  if (message.authorId === mikoto.user.me!.id) return false;

  // If this channel tab is active, skip the notification and signal auto-ack
  if (_activeChannelId === message.channelId) {
    return true;
  }

  if (document.hasFocus()) return false;

  const channel = mikoto.channels._get(message.channelId);
  if (!channel) return false;

  const channelId = message.channelId;
  const existing = recentByChannel.get(channelId);

  if (existing) {
    existing.count += 1;
    if (existing.count === BATCH_THRESHOLD) {
      clearTimeout(existing.timer);
      const spaceName = channel.spaceId
        ? mikoto.spaces._get(channel.spaceId)?.name
        : 'DM';
      showNotification(
        `${existing.count} new messages`,
        `in #${channel.name} (${spaceName})`,
        normalizeMediaUrl(message.author?.avatar),
      );
      const timer = setTimeout(() => {
        recentByChannel.delete(channelId);
      }, BATCH_WINDOW_MS);
      existing.timer = timer;
    }
    return false;
  }

  recentByChannel.set(channelId, {
    count: 1,
    timer: setTimeout(() => {
      recentByChannel.delete(channelId);
    }, BATCH_WINDOW_MS),
  });

  let title: string;
  if (channel.spaceId) {
    const space = mikoto.spaces._get(channel.spaceId);
    if (!space) return false;
    title = `${message.author?.name} (#${channel.name}, ${space.name})`;
  } else {
    title = `${message.author?.name} (DM)`;
  }

  showNotification(
    title,
    message.content,
    normalizeMediaUrl(message.author?.avatar),
  );
  return false;
}
