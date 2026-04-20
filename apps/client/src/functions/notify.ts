import { MessageExt, MikotoClient } from '@mikoto-io/mikoto.js';

import { normalizeMediaUrl } from '@/components/atoms/Avatar';
import { toaster } from '@/components/ui/toaster';

export type NotificationMode = 'none' | 'native' | 'toast';

const NOTIFICATION_MODE_KEY = 'notificationMode';

export function getNotificationMode(): NotificationMode {
  const stored = localStorage.getItem(NOTIFICATION_MODE_KEY);
  if (stored === 'none' || stored === 'native' || stored === 'toast') {
    return stored;
  }
  return 'native';
}

export function setNotificationMode(mode: NotificationMode) {
  localStorage.setItem(NOTIFICATION_MODE_KEY, mode);
}

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

function playSound() {
  if (isSoundEnabled()) {
    audio.play();
  }
}

function showNotification(title: string, body: string, icon?: string) {
  const mode = getNotificationMode();
  if (mode === 'none') return;

  if (mode === 'toast') {
    toaster.create({
      title,
      description: body,
      type: 'info',
      duration: 3000,
    });
    playSound();
    return;
  }

  if (Notification.permission !== 'granted') return;

  const notification = new Notification(title, {
    body,
    icon,
    silent: true,
  });
  notification.onshow = () => {
    playSound();
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

  const channel = mikoto.channels._get(message.channelId);
  if (!channel) return false;

  const channelId = message.channelId;
  const existing = recentByChannel.get(channelId);

  if (existing) {
    existing.count += 1;
    if (existing.count >= BATCH_THRESHOLD) {
      clearTimeout(existing.timer);
      const spaceName = channel.spaceId
        ? mikoto.spaces._get(channel.spaceId)?.name
        : 'DM';
      showNotification(
        `${existing.count} new messages`,
        `in #${channel.name} (${spaceName})`,
        normalizeMediaUrl(message.author?.avatar),
      );
      existing.timer = setTimeout(() => {
        recentByChannel.delete(channelId);
      }, BATCH_WINDOW_MS);
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
