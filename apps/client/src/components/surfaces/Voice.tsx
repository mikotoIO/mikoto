import styled from '@emotion/styled';
import { faMicrophone } from '@fortawesome/free-solid-svg-icons';
import {
  ControlBar,
  GridLayout,
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { VoiceToken } from '@mikoto-io/mikoto.js';
import { RoomEvent, Track } from 'livekit-client';
import { useEffect, useState } from 'react';

import { Surface } from '@/components/Surface';
import { TabName } from '@/components/tabs';
import { useMikoto } from '@/hooks';

function Stage() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { updateOnlyOn: [RoomEvent.ActiveSpeakersChanged], onlySubscribed: false },
  );

  return (
    <GridLayout tracks={tracks}>
      <ParticipantTile />
    </GridLayout>
  );
}

const VoiceViewWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;

  .lk-grid-layout {
    flex: 1;
    height: 100px;
    flex-basis: 0;
  }
`;

export default function VoiceSurface({ channelId }: { channelId: string }) {
  const mikoto = useMikoto();
  const channel = mikoto.channels._get(channelId)!;

  const [voiceConfig, setVoiceConfig] = useState<VoiceToken | null>(null);
  useEffect(() => {
    mikoto.rest['voice.join'](undefined, {
      params: {
        spaceId: channel.spaceId,
        channelId: channel.id,
      },
    }).then((x) => {
      setVoiceConfig(x);
    });
  }, []);

  return (
    <Surface data-lk-theme="default">
      <TabName name={channel.name} icon={faMicrophone} />
      {voiceConfig && (
        <LiveKitRoom
          serverUrl={voiceConfig.url}
          token={voiceConfig.token}
          audio
        >
          <VoiceViewWrapper>
            <Stage />
            <ControlBar variation="minimal" />
          </VoiceViewWrapper>
          <RoomAudioRenderer />
          {/* <VideoConference /> */}
        </LiveKitRoom>
      )}
    </Surface>
  );
}
