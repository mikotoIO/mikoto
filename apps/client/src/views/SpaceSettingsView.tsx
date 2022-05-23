import { ViewContainer } from '../components/ViewContainer';
import { Space } from '../models';

export function SpaceSettingsView({ space }: { space: Space }) {
  return (
    <ViewContainer>
      <h1>Space Overview</h1>
      <p>{space.name}</p>
    </ViewContainer>
  );
}
