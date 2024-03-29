import { faRobot } from '@fortawesome/free-solid-svg-icons';

import { TabName } from '../TabBar';
import { ViewContainer } from '../ViewContainer';

export function BotSettingSurface({ botId }: { botId: string }) {
  return (
    <ViewContainer padded scroll>
      <TabName icon={faRobot} name="Manage Bot" />
      <h1>Manage Bot</h1>
      bot surface goes here
    </ViewContainer>
  );
}
