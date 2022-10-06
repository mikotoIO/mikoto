import { LiveKitRoom } from '@livekit/react-components';
import React, { useEffect, useState } from 'react';
import { ViewContainer } from '../components/ViewContainer';
import { useMikoto } from '../api';
import { VoiceResponse } from '../models';

export function VoiceView() {
  const mikoto = useMikoto();

  const [voiceConfig, setVoiceConfig] = useState<VoiceResponse | null>(null);
  useEffect(() => {
    mikoto.getVoice().then((x) => {
      setVoiceConfig(x);
    });
  }, []);

  return (
    <ViewContainer>
      {voiceConfig && (
        <LiveKitRoom
          url={voiceConfig.url}
          token={voiceConfig.token}
          onConnected={async (room) => {
            await room.localParticipant.setCameraEnabled(true);
            await room.localParticipant.setMicrophoneEnabled(true);
          }}
        />
      )}
    </ViewContainer>
  );
}
