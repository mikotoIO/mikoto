import { faRobot } from '@fortawesome/free-solid-svg-icons';

import { ViewContainer } from '@/components/ViewContainer';
import { TabName } from '@/components/tabs';

export function BotSettingSurface({ botId }: { botId: string }) {
  return (
    <ViewContainer padded scroll>
      <TabName icon={faRobot} name="Manage Bot" />
      <h1>Manage Bot</h1>
      bot surface goes here
    </ViewContainer>
  );
}
