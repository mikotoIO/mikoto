import { InputWrapper, TextInput } from '@mantine/core';
import { useState } from 'react';
import { ScrollingViewContainer } from '../components/ViewContainer';
import { Space } from '../models';

export function SpaceSettingsView({ space }: { space: Space }) {
  const [spaceName, setSpaceName] = useState(space.name);
  return (
    <ScrollingViewContainer>
      <h1>Space Overview</h1>
      <InputWrapper label="Space Name">
        <TextInput
          value={spaceName}
          onChange={(x) => setSpaceName(x.target.value)}
        />
      </InputWrapper>
    </ScrollingViewContainer>
  );
}
