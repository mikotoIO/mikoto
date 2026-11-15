import {
  AudioTrack,
  ConnectionQualityIndicator,
  DisconnectButton,
  FocusToggle,
  GridLayout,
  LiveKitRoom,
  MediaDeviceMenu,
  ParticipantTile,
  RoomAudioRenderer,
  VideoTrack,
  isTrackReference,
  useConnectionState,
  useEnsureTrackRef,
  useIsMuted,
  useTrackToggle,
  useTracks,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { MikotoChannel, VoiceToken } from '@mikoto-io/mikoto.js';
import {
  ConnectionState,
  DisconnectReason,
  RoomEvent,
  Track,
} from 'livekit-client';
import {
  type LucideIcon,
  Mic,
  MicOff,
  PhoneOff,
  RefreshCw,
  ScreenShare,
  ScreenShareOff,
  Settings2,
  Video,
  VideoOff,
  Volume2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Surface } from '@/components/Surface';
import { Avatar } from '@/components/atoms/Avatar';
import { TabName } from '@/components/tabs';
import {
  Button,
  EmptyState,
  ErrorState,
  PaneHeader,
  Skeleton,
  SkeletonGroup,
  useSkeletonVisible,
} from '@/design';
import { useMikoto } from '@/hooks';
import { useTabkit } from '@/store/surface';

import styles from './Voice.module.css';

/* ------------------------------------------------------------- skeleton */

const SKELETON_TILES = ['a', 'b', 'c'];
const SKELETON_CONTROLS = ['mic', 'camera', 'screen', 'settings', 'leave'];

/** Mirrors the call layout: a few tiles and the round control bar. */
function VoiceSkeleton() {
  return (
    <SkeletonGroup label="voice call" className={styles.skeleton}>
      <div className={styles.skeletonTiles}>
        {SKELETON_TILES.map((id) => (
          <div key={id} className={styles.skeletonTile}>
            <Skeleton circle width={68} />
            <Skeleton
              width={90}
              height={22}
              radius={6}
              className={styles.skeletonName}
            />
          </div>
        ))}
      </div>
      <div className={styles.bar}>
        {SKELETON_CONTROLS.map((id) => (
          <Skeleton key={id} circle width={46} />
        ))}
      </div>
    </SkeletonGroup>
  );
}

/** Applies the loading model (delay, then minimum duration) to a flag. */
function DelayedVoiceSkeleton({ loading }: { loading: boolean }) {
  const visible = useSkeletonVisible(loading);
  return visible ? <VoiceSkeleton /> : null;
}

/* ----------------------------------------------------------------- tile */

function ParticipantTileContent() {
  const trackRef = useEnsureTrackRef();
  const { participant } = trackRef;
  const isVideo =
    trackRef.publication?.kind === 'video' ||
    trackRef.source === Track.Source.Camera ||
    trackRef.source === Track.Source.ScreenShare;
  const hasTrack = isTrackReference(trackRef);
  const micMuted = useIsMuted({
    participant,
    source: Track.Source.Microphone,
  });
  const name = participant.name || participant.identity;

  return (
    <>
      {hasTrack && isVideo && <VideoTrack trackRef={trackRef} />}
      {hasTrack && !isVideo && <AudioTrack trackRef={trackRef} />}
      <div className={styles.placeholder} aria-hidden>
        <span className={styles.avatar}>
          <Avatar userId={participant.identity} size={68} />
        </span>
      </div>
      <ConnectionQualityIndicator className={styles.quality} />
      <div className={styles.nameLabel}>
        {micMuted && (
          <MicOff size={13} className={styles.mutedIcon} aria-label="Muted" />
        )}
        <span className={styles.nameText}>
          {name}
          {participant.isLocal ? ' (you)' : ''}
        </span>
      </div>
      <FocusToggle trackRef={trackRef} />
    </>
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
    <div className={styles.stage}>
      <GridLayout tracks={tracks}>
        <ParticipantTile>
          <ParticipantTileContent />
        </ParticipantTile>
      </GridLayout>
    </div>
  );
}

/* ------------------------------------------------------------- controls */

type ToggleSource =
  | Track.Source.Microphone
  | Track.Source.Camera
  | Track.Source.ScreenShare;

const TOGGLES: {
  source: ToggleSource;
  on: { icon: LucideIcon; label: string };
  off: { icon: LucideIcon; label: string };
  /** Whether "off" is the state to call out (muted mic) or the normal one. */
  warnWhenOff: boolean;
}[] = [
  {
    source: Track.Source.Microphone,
    on: { icon: Mic, label: 'Mute' },
    off: { icon: MicOff, label: 'Unmute' },
    warnWhenOff: true,
  },
  {
    source: Track.Source.Camera,
    on: { icon: Video, label: 'Turn off camera' },
    off: { icon: VideoOff, label: 'Turn on camera' },
    warnWhenOff: false,
  },
  {
    source: Track.Source.ScreenShare,
    on: { icon: ScreenShareOff, label: 'Stop sharing' },
    off: { icon: ScreenShare, label: 'Share screen' },
    warnWhenOff: false,
  },
];

function ToggleButton({ toggle }: { toggle: (typeof TOGGLES)[number] }) {
  const { buttonProps, enabled, pending } = useTrackToggle({
    source: toggle.source,
  });
  const { icon: Icon, label } = enabled ? toggle.on : toggle.off;
  return (
    <button
      {...buttonProps}
      type="button"
      className={styles.control}
      aria-label={label}
      title={label}
      disabled={pending}
      data-off={!enabled && toggle.warnWhenOff}
    >
      <Icon size={18} aria-hidden />
    </button>
  );
}

function Controls() {
  return (
    <div className={styles.bar} role="toolbar" aria-label="Call controls">
      {TOGGLES.map((t) => (
        <ToggleButton key={t.source} toggle={t} />
      ))}
      <MediaDeviceMenu
        className={styles.control}
        aria-label="Choose microphone, camera and speakers"
        title="Devices"
      >
        <Settings2 size={18} aria-hidden />
      </MediaDeviceMenu>
      <DisconnectButton
        className={`${styles.control} ${styles.leave}`}
        aria-label="Leave call"
        title="Leave call"
      >
        <PhoneOff size={18} aria-hidden />
      </DisconnectButton>
    </div>
  );
}

/** Inside the room: skeleton while connecting, then the call. */
function Call() {
  const state = useConnectionState();
  const connecting =
    state === ConnectionState.Connecting ||
    state === ConnectionState.Disconnected;

  if (connecting) return <DelayedVoiceSkeleton loading />;
  return (
    <>
      <Stage />
      <Controls />
    </>
  );
}

/* ---------------------------------------------------------------- state */

type JoinState =
  | { status: 'loading' }
  | { status: 'ready'; config: VoiceToken }
  | { status: 'tokenError'; error: unknown }
  | { status: 'connectError' }
  | { status: 'dropped' };

function VoiceCall({ channel }: { channel: MikotoChannel }) {
  const mikoto = useMikoto();
  const tabkit = useTabkit();
  const [attempt, setAttempt] = useState(0);
  const [join, setJoin] = useState<JoinState>({ status: 'loading' });
  // Once we're showing an error, LiveKit's own teardown disconnect must not
  // close the tab out from under it.
  const failedRef = useRef(false);

  const spaceId = channel.spaceId;
  useEffect(() => {
    if (!spaceId) return;
    let cancelled = false;
    mikoto.rest['voice.join'](undefined, {
      params: { spaceId, channelId: channel.id },
    })
      .then((config) => {
        if (!cancelled) setJoin({ status: 'ready', config });
      })
      .catch((error: unknown) => {
        if (!cancelled) setJoin({ status: 'tokenError', error });
      });
    return () => {
      cancelled = true;
    };
  }, [mikoto, spaceId, channel.id, attempt]);

  const retry = () => {
    failedRef.current = false;
    setJoin({ status: 'loading' });
    setAttempt((a) => a + 1);
  };

  const fail = (next: JoinState) => {
    failedRef.current = true;
    setJoin(next);
  };

  if (!spaceId) {
    return (
      <EmptyState
        icon={<Volume2 size={20} aria-hidden />}
        title="Voice isn't available here"
        description="Voice channels only work inside a space. Open one from a space's sidebar."
      />
    );
  }

  switch (join.status) {
    case 'loading':
      return <DelayedVoiceSkeleton loading />;
    case 'tokenError':
      return (
        <ErrorState what={channel.name} error={join.error} onRetry={retry} />
      );
    case 'connectError':
    case 'dropped':
      return (
        <EmptyState
          icon={<PhoneOff size={20} aria-hidden />}
          title={
            join.status === 'dropped'
              ? `You were disconnected from ${channel.name}`
              : `Couldn't connect to ${channel.name}`
          }
          description="The voice server didn't respond. Check your connection, then try again."
          action={
            <Button variant="primary" onClick={retry}>
              <RefreshCw size={14} aria-hidden />
              {join.status === 'dropped' ? 'Rejoin' : 'Try again'}
            </Button>
          }
        />
      );
    case 'ready':
      return (
        <LiveKitRoom
          key={attempt}
          serverUrl={join.config.url}
          token={join.config.token}
          audio
          data-lk-theme="default"
          className={styles.room}
          onError={() => fail({ status: 'connectError' })}
          onDisconnected={(reason) => {
            if (failedRef.current) return;
            if (
              reason === undefined ||
              reason === DisconnectReason.CLIENT_INITIATED
            ) {
              // The user left (or closed the tab): close the call tab.
              tabkit.removeTab(`voiceChannel/${channel.id}`);
            } else {
              fail({ status: 'dropped' });
            }
          }}
        >
          <Call />
          <RoomAudioRenderer />
        </LiveKitRoom>
      );
  }
}

export default function VoiceSurface({ channelId }: { channelId: string }) {
  const mikoto = useMikoto();
  const channel = mikoto.channels._get(channelId);

  if (!channel) {
    return (
      <Surface>
        <TabName name="Voice" icon={Volume2} />
        <EmptyState
          icon={<Volume2 size={20} aria-hidden />}
          title="This voice channel isn't available"
          description="It may have been deleted, or you no longer have access to its space. Close this tab, or pick another channel from the sidebar."
        />
      </Surface>
    );
  }

  return (
    <Surface>
      <TabName
        name={channel.name}
        icon={channel.space?.icon ?? Volume2}
        spaceId={channel.space?.id}
        spaceName={channel.space?.name}
      />
      <PaneHeader
        icon={<Volume2 size={16} aria-hidden />}
        title={channel.name}
      />
      <div className={styles.status}>
        <VoiceCall channel={channel} />
      </div>
    </Surface>
  );
}
