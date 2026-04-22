import styled from '@emotion/styled';
import { faMicrophone } from '@fortawesome/free-solid-svg-icons';
import {
  AudioTrack,
  BarVisualizer,
  ConnectionQualityIndicator,
  ControlBar,
  FocusToggle,
  GridLayout,
  LiveKitRoom,
  ParticipantName,
  ParticipantTile,
  RoomAudioRenderer,
  TrackMutedIndicator,
  VideoTrack,
  isTrackReference,
  useEnsureTrackRef,
  useTracks,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { VoiceToken } from '@mikoto-io/mikoto.js';
import { RoomEvent, Track } from 'livekit-client';
import { useEffect, useState } from 'react';

import { Surface } from '@/components/Surface';
import { Avatar } from '@/components/atoms/Avatar';
import { TabName } from '@/components/tabs';
import { useMikoto } from '@/hooks';
import { useTabkit } from '@/store/surface';

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
        <ParticipantName className="mikoto-participant-placeholder-name" />
      </div>
      <div className="lk-participant-metadata">
        <div className="lk-participant-metadata-item mikoto-participant-metadata-name">
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
  background-color: var(--chakra-colors-gray-800);

  && {
    --lk-fg: var(--chakra-colors-gray-50);
    --lk-fg2: var(--chakra-colors-gray-150);
    --lk-fg3: var(--chakra-colors-gray-300);
    --lk-fg4: var(--chakra-colors-gray-400);
    --lk-fg5: var(--chakra-colors-gray-500);

    --lk-bg: var(--chakra-colors-gray-850);
    --lk-bg2: var(--chakra-colors-gray-800);
    --lk-bg3: var(--chakra-colors-gray-750);
    --lk-bg4: var(--chakra-colors-gray-700);
    --lk-bg5: var(--chakra-colors-gray-650);

    --lk-border-color: var(--chakra-colors-gray-650);
    --lk-border-radius: 8px;

    --lk-accent-fg: #ffffff;
    --lk-accent-bg: var(--chakra-colors-blue-600);
    --lk-accent2: var(--chakra-colors-blue-500);
    --lk-accent3: var(--chakra-colors-blue-400);
    --lk-accent4: var(--chakra-colors-blue-300);

    --lk-danger-fg: #ffffff;
    --lk-danger: var(--chakra-colors-red-600);
    --lk-danger2: var(--chakra-colors-red-500);
    --lk-danger3: var(--chakra-colors-red-400);
    --lk-danger4: var(--chakra-colors-red-300);

    --lk-success-fg: #ffffff;
    --lk-success: hsl(145, 65%, 45%);
    --lk-success2: hsl(145, 65%, 52%);
    --lk-success3: hsl(145, 65%, 58%);
    --lk-success4: hsl(145, 65%, 64%);

    --lk-connection-excellent: hsl(145, 65%, 50%);
    --lk-connection-good: hsl(33, 100%, 55%);
    --lk-connection-poor: var(--chakra-colors-red-500);

    --lk-control-fg: var(--chakra-colors-gray-100);
    --lk-control-bg: var(--chakra-colors-gray-750);
    --lk-control-hover-bg: var(--chakra-colors-gray-700);
    --lk-control-active-bg: var(--chakra-colors-gray-650);
    --lk-control-active-hover-bg: var(--chakra-colors-gray-600);

    --lk-font-family: var(--font-main);
    --lk-font-size: 14px;
    --lk-grid-gap: 12px;
    --lk-control-bar-height: 64px;
  }

  .lk-grid-layout {
    flex: 1;
    height: 100px;
    flex-basis: 0;
    padding: var(--lk-grid-gap);
    background-color: var(--chakra-colors-gray-800);
  }

  .lk-participant-tile {
    background-color: var(--chakra-colors-gray-850);
    border: 1px solid var(--chakra-colors-gray-700);
    border-radius: var(--lk-border-radius);
    overflow: hidden;
    transition:
      border-color 0.15s ease,
      box-shadow 0.15s ease;
  }

  .lk-participant-tile[data-lk-speaking='true'] {
    border-color: var(--chakra-colors-blue-500);
    box-shadow: 0 0 0 1px var(--chakra-colors-blue-500);
  }

  .lk-participant-name {
    font-family: var(--font-heading);
  }

  .lk-participant-placeholder {
    background-color: var(--chakra-colors-gray-850);
  }

  .lk-participant-metadata-item {
    background-color: rgba(10, 10, 12, 0.6);
    backdrop-filter: blur(4px);
    color: var(--chakra-colors-gray-100);
    font-size: 12px;
    font-weight: 500;
    border-radius: 4px;
    padding: 4px 8px;
  }

  .lk-control-bar {
    background-color: var(--chakra-colors-gray-850);
    border-top: 1px solid var(--chakra-colors-gray-700);
    padding: 8px 12px;
    gap: 8px;
  }

  .lk-button {
    background-color: var(--chakra-colors-gray-750);
    color: var(--chakra-colors-gray-100);
    border-radius: 6px;
    font-weight: 500;

    &:hover {
      background-color: var(--chakra-colors-gray-700);
    }

    &[aria-pressed='true'] {
      background-color: var(--chakra-colors-blue-600);
      color: #ffffff;
    }

    &[aria-pressed='true']:hover {
      background-color: var(--chakra-colors-blue-500);
    }
  }

  .lk-disconnect-button {
    background-color: var(--chakra-colors-red-600);
    color: #ffffff;

    &:hover {
      background-color: var(--chakra-colors-red-500);
    }
  }

  .mikoto-participant-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;

    > svg {
      display: none;
    }
  }

  .mikoto-participant-placeholder-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--chakra-colors-gray-100);
  }

  .lk-participant-tile[data-lk-video-muted='true'][data-lk-source='camera']
    .mikoto-participant-metadata-name {
    display: none;
  }
`;

export default function VoiceSurface({ channelId }: { channelId: string }) {
  const mikoto = useMikoto();
  const tabkit = useTabkit();
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
          onDisconnected={() => {
            tabkit.removeTab(`voiceChannel/${channelId}`);
          }}
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
