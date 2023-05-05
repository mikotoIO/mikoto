import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput } from 'react-native';

import { SafeAreaView } from './components/SafeAreaView';

export default function App() {
  return (
    <SafeAreaView>
      <View style={styles.container}>
        <View style={styles.messages}>
          <Text>Open up App.tsx to start working on your app!</Text>
        </View>
        <ExpoStatusBar style="auto" />
        <TextInput style={styles.input} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messages: {
    flex: 1,
  },
  input: {
    // fill up all horizontal space
    width: '100%',
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
});
