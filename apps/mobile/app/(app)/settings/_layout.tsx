import { Stack } from 'expo-router';

import { colors } from '../../../src/theme';

export default function SettingsLayout() {
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
