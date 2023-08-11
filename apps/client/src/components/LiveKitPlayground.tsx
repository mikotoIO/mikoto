import { LiveKitRoom } from '@livekit/react-components';
import '@livekit/react-components/dist/index.css';
import { useState } from 'react';
import 'react-aspect-ratio/aspect-ratio.css';

export function RoomPage() {
  const url = 'ws://localhost:7880';
  const token =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2NjQ0OTg0NDIsImlzcyI6ImRldmtleSIsIm5hbWUiOiJ1c2VyMSIsIm5iZiI6MTY2NDQxMjA0Miwic3ViIjoidXNlcjEiLCJ2aWRlbyI6eyJyb29tIjoibXktZmlyc3Qtcm9vbSIsInJvb21Kb2luIjp0cnVlfX0.arOMpzqY1Ou32vOQmzxALtLG8HBogSpek1IvbX9ndi8';

  const [clicked, setClicked] = useState(false);
  if (!clicked)
    return (
      <button type="button" onClick={() => setClicked(true)}>
        Click me
      </button>
    );

  return (
    <div className="roomContainer">
      <LiveKitRoom
        url={url}
        token={token}
        onConnected={async (room) => {
          await room.localParticipant.setCameraEnabled(true);
          await room.localParticipant.setMicrophoneEnabled(true);
        }}
      />
    </div>
  );
}
