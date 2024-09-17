import { MessageExt, MikotoClient } from 'mikotojs';

import { normalizeMediaUrl } from '@/components/atoms/Avatar';

const audio = new Audio('audio/notification/ping.ogg');
audio.volume = 0.3;
audio.load();

export function notifyFromMessage(mikoto: MikotoClient, message: MessageExt) {
  if (message.authorId === mikoto.me.id) return;
  const channel = mikoto.channels.get(message.channelId);
  if (!channel) return;
  const space = mikoto.spaces.get(channel.spaceId);
  if (!space) return;

  const notification = new Notification(
    `${message.author?.name} (#${channel.name}, ${space.name})`,
    {
      body: message.content,
      icon: normalizeMediaUrl(message.author?.avatar),
      silent: true,
    },
  );
  notification.onshow = () => {
    audio.play();

    setTimeout(() => {
      notification.close();
    }, 3000);
  };
}
