import { MessageExt, MikotoClient } from '@mikoto-io/mikoto.js';

import { normalizeMediaUrl } from '@/components/atoms/Avatar';

const audio = new Audio('audio/notification/ping.ogg');
audio.volume = 0.3;
audio.load();

export function notifyFromMessage(mikoto: MikotoClient, message: MessageExt) {
  if (message.authorId === mikoto.user.me!.id) return;
  const channel = mikoto.channels._get(message.channelId);
  if (!channel) return;

  let title: string;
  if (channel.spaceId) {
    const space = mikoto.spaces._get(channel.spaceId);
    if (!space) return;
    title = `${message.author?.name} (#${channel.name}, ${space.name})`;
  } else {
    title = `${message.author?.name} (DM)`;
  }

  const notification = new Notification(title, {
    body: message.content,
    icon: normalizeMediaUrl(message.author?.avatar),
    silent: true,
  });
  notification.onshow = () => {
    audio.play();

    setTimeout(() => {
      notification.close();
    }, 3000);
  };
}
