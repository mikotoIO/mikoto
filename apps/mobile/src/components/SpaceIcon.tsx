import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from './Avatar';
import { colors, borderRadius } from '../theme';

interface SpaceIconProps {
  name: string;
  icon?: string | null;
  isActive?: boolean;
  onPress?: () => void;
}

export function SpaceIcon({ name, icon, isActive, onPress }: SpaceIconProps) {
  return (
    <Pressable onPress={onPress} style={styles.container}>
      <View
        style={[
          styles.iconWrapper,
          isActive && styles.iconWrapperActive,
        ]}
      >
        <Avatar uri={icon} name={name} size={48} rounded />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 4,
  },
  iconWrapper: {
    borderRadius: borderRadius.full,
    padding: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconWrapperActive: {
    borderColor: colors.B600,
  },
});
