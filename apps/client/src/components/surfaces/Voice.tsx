import styled from '@emotion/styled';
import { faMicrophone } from '@fortawesome/free-solid-svg-icons';
import {
  AudioTrack,
  ConnectionQualityIndicator,
  ControlBar,
  FocusToggle,
  GridLayout,
  isTrackReference,
  LiveKitRoom,
  ParticipantName,
  ParticipantTile,
  RoomAudioRenderer,
  TrackMutedIndicator,
  useEnsureTrackRef,
  useTracks,
  VideoTrack,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { VoiceToken } from '@mikoto-io/mikoto.js';
import { RoomEvent, Track } from 'livekit-client';
import { useEffect, useState } from 'react';

import { Avatar } from '@/components/atoms/Avatar';
import { Surface } from '@/components/Surface';
import { TabName } from '@/components/tabs';
import { useMikoto } from '@/hooks';

function MikotoParticipantTileContent() {
  const trackRef = useEnsureTrackRef();
  const { participant } = trackRef;
  const isVideo =
    trackRef.publication?.kind === 'video' ||
    trackRef.source === Track.Source.Camera ||
    trackRef.source === Track.Source.ScreenShare;
  const hasTrack = isTrackReference(trackRef);

  return (
    <>
      {hasTrack && isVideo && <VideoTrack trackRef={trackRef} />}
      {hasTrack && !isVideo && <AudioTrack trackRef={trackRef} />}
      <div className="lk-participant-placeholder mikoto-participant-placeholder">
        <Avatar userId={participant.identity} size={96} />
      </div>
      <div className="lk-participant-metadata">
        <div className="lk-participant-metadata-item">
          <TrackMutedIndicator
            trackRef={{
              participant,
              source: Track.Source.Microphone,
            }}
            show="muted"
          />
          <ParticipantName />
        </div>
        <ConnectionQualityIndicator className="lk-participant-metadata-item" />
      </div>
      <FocusToggle trackRef={trackRef} />
    </>
  );
}

function MikotoParticipantTile() {
  return (
    <ParticipantTile>
      <MikotoParticipantTileContent />
    </ParticipantTile>
  );
}

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
      <MikotoParticipantTile />
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

  .mikoto-participant-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
      display: none;
    }
  }
`;

export default function VoiceSurface({ channelId }: { channelId: string }) {
  const mikoto = useMikoto();
  const channel = mikoto.channels._get(channelId)!;

  const [voiceConfig, setVoiceConfig] = useState<VoiceToken | null>(null);
  useEffect(() => {
    if (!channel.spaceId) return;
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
      <TabName
        name={channel.name}
        icon={channel.space?.icon ?? faMicrophone}
        spaceId={channel.space?.id}
        spaceName={channel.space?.name}
      />
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
