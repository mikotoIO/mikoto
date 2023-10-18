import { Text, View, StyleSheet } from 'react-native';

import { theme } from '../lucid/theme';

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.N900,
    flex: 1,
  },
});

export function Explorer() {
  return (
    <View style={styles.container}>
      <Text>channels go here</Text>
    </View>
  );
}
