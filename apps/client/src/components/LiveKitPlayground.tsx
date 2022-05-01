import { LiveKitRoom } from 'livekit-react';

import 'livekit-react/dist/index.css';
import 'react-aspect-ratio/aspect-ratio.css';
import { useState } from 'react';

export const RoomPage = () => {
  const url = 'ws://localhost:7880';
  const token = process.env.REACT_APP_LIVEKIT_TOKEN ?? '';

  const [clicked, setClicked] = useState(false);
  if (!clicked)
    return <button onClick={() => setClicked(true)}>Click me</button>;

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
};
