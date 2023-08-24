import { LiveKitRoom } from '@livekit/react-components';
import '@livekit/react-components/dist/index.css';
import { VoiceToken } from 'mikotojs';
import { useEffect, useState } from 'react';

import { useMikoto } from '../../hooks';
import { TabName } from '../TabBar';
import { ViewContainer } from '../ViewContainer';

export function VoiceView({ channelId }: { channelId: string }) {
  const mikoto = useMikoto();
  const channel = mikoto.channels.get(channelId)!;

  const [voiceConfig, setVoiceConfig] = useState<VoiceToken | null>(null);
  useEffect(() => {
    mikoto.client.voice.join(channel.id).then((x) => {
      setVoiceConfig(x);
    });
  }, []);

  return (
    <ViewContainer>
      <TabName name={`Voice: ${channel.name}`} />
      {voiceConfig && (
        <LiveKitRoom
          url={voiceConfig.url}
          token={voiceConfig.token}
          onConnected={async (room) => {
            await room.localParticipant.setMicrophoneEnabled(true);
          }}
        />
      )}
    </ViewContainer>
  );
}
