import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { colors, borderRadius } from '../theme';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
  rounded?: boolean;
}

export function Avatar({ uri, name, size = 40, rounded = false }: AvatarProps) {
  const radius = rounded ? size / 2 : borderRadius.sm;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, { width: size, height: size, borderRadius: radius }]}
        contentFit="cover"
        transition={200}
      />
    );
  }

  const initial = name?.charAt(0)?.toUpperCase() ?? '?';
  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: radius },
      ]}
    >
      <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.N700,
  },
  fallback: {
    backgroundColor: colors.V700,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: colors.N0,
    fontWeight: '600',
  },
});
