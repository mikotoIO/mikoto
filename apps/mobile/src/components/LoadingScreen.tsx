import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors } from '../theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.N1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export function LoadingScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.B600} />
    </View>
  );
}
