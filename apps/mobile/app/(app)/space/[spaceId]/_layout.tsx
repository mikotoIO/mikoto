import { Stack, useLocalSearchParams } from 'expo-router';

import { colors } from '../../../../src/theme';

export default function SpaceLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.N1000 },
        animation: 'slide_from_right',
      }}
    />
  );
}
