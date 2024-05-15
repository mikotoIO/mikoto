import { faRobot } from '@fortawesome/free-solid-svg-icons';

import { Surface } from '@/components/Surface';
import { TabName } from '@/components/tabs';

export function BotSettingSurface({ botId }: { botId: string }) {
  return (
    <Surface padded scroll>
      <TabName icon={faRobot} name="Manage Bot" />
      <h1>Manage Bot</h1>
      bot surface goes here
    </Surface>
  );
}
