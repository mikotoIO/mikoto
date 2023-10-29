import { faMicrophone } from '@fortawesome/free-solid-svg-icons';
import {
  GridLayout,
  LiveKitRoom,
  ParticipantTile,
  useTracks,
  ControlBar,
  RoomAudioRenderer,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { RoomEvent, Track } from 'livekit-client';
import { VoiceToken } from 'mikotojs';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { useMikoto } from '../../hooks';
import { TabName } from '../TabBar';
import { ViewContainer } from '../ViewContainer';

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

export function VoiceView({ channelId }: { channelId: string }) {
  const mikoto = useMikoto();
  const channel = mikoto.channels.get(channelId)!;

  const [voiceConfig, setVoiceConfig] = useState<VoiceToken | null>(null);
  useEffect(() => {
    mikoto.client.voice
      .join({
        channelId: channel.id,
      })
      .then((x) => {
        setVoiceConfig(x);
      });
  }, []);

  return (
    <ViewContainer data-lk-theme="default">
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
    </ViewContainer>
  );
}
