import { StyleSheet, Text, View } from 'react-native';

const styles = StyleSheet.create({
  viewContainer: {},
});

export function AuthView() {
  return (
    <View style={styles.viewContainer}>
      <Text>Auth View (should) go here</Text>
    </View>
  );
}
