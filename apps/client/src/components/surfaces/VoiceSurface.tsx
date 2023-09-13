import { faMicrophone } from '@fortawesome/free-solid-svg-icons';
import {
  GridLayout,
  LiveKitRoom,
  VideoConference,
  ParticipantTile,
  useTracks,
  TrackContext,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track } from 'livekit-client';
import { VoiceToken } from 'mikotojs';
import { useEffect, useState } from 'react';

import { useMikoto } from '../../hooks';
import { TabName } from '../TabBar';
import { ViewContainer } from '../ViewContainer';

function Stage() {
  const cameraTracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
  ]);
  const screenShareTrack = useTracks([Track.Source.ScreenShare])[0];

  return (
    <>
      {screenShareTrack && <ParticipantTile {...screenShareTrack} />}
      <GridLayout tracks={cameraTracks} style={{ width: '500px' }}>
        <TrackContext.Consumer>
          {(track) => <ParticipantTile {...track} style={{ width: '500px' }} />}
        </TrackContext.Consumer>
      </GridLayout>
    </>
  );
}

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
    <ViewContainer data-lk-theme="default">
      <TabName name={`Voice: ${channel.name}`} icon={faMicrophone} />
      {voiceConfig && (
        <LiveKitRoom
          serverUrl={voiceConfig.url}
          token={voiceConfig.token}
          audio
          video
          onConnected={() => {
            console.log('connecting');
            // await room.localParticipant.setMicrophoneEnabled(true);
          }}
        >
          <VideoConference />
        </LiveKitRoom>
      )}
    </ViewContainer>
  );
}
