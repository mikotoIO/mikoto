import { Message, MikotoClient } from 'mikotojs';

import { normalizeMediaUrl } from '../components/atoms/Avatar';

const audio = new Audio('audio/notification/ping.ogg');
audio.volume = 0.3;
audio.load();

export function notifyFromMessage(mikoto: MikotoClient, message: Message) {
  if (message.authorId === mikoto.me.id) return;
  const ch = mikoto.channels.get(message.channelId);

  const channelDescriptor = ch ? ` (#${ch.name})` : '';

  const notification = new Notification(
    `${message.author?.name}${channelDescriptor}`,
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
