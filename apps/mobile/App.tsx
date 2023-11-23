import SideMenu from '@chakrahq/react-native-side-menu';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  View,
} from 'react-native';

import { Explorer } from './components/Explorer';
import { Message } from './components/Message';
import { SafeAreaView } from './components/SafeAreaView';
import { theme } from './lucid/theme';

const styles = StyleSheet.create({
  container: {
    padding: 4,
    flex: 1,
    backgroundColor: theme.colors.N800,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: theme.colors.N0,
  },
  messages: {
    flex: 1,
    flexGrow: 1,
    width: '100%',
    padding: 8,
  },
  messageInner: {
    gap: 16,
  },
  input: {
    // fill up all horizontal space
    borderColor: undefined,
    backgroundColor: theme.colors.N700,
    color: theme.colors.N0,
    borderTopWidth: 0,
    height: 40,
    flex: 1,
    borderRadius: 4,
    borderWidth: 0,
    padding: 10,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: theme.colors.B700,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

function MessageInput() {
  const [text, setText] = useState('');
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 8,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Type a message"
        placeholderTextColor={theme.colors.N400}
      />
      <TouchableHighlight
        onPress={() => {
          setText('');
        }}
      >
        <View style={styles.sendButton}>
          <FontAwesomeIcon icon={faPaperPlane} color={theme.colors.N0} />
        </View>
      </TouchableHighlight>
    </View>
  );
}

function MessageSurface() {
  return (
    <View style={styles.container}>
      <View style={styles.messages}>
        <View style={styles.messageInner}>
          <Message />
          <Message />
          <Message />
        </View>
      </View>
      <ExpoStatusBar style="auto" />
      <MessageInput />
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <SafeAreaView>
        <StatusBar
          backgroundColor={theme.colors.N1100}
          barStyle="light-content"
        />
        <View style={{ flex: 1, backgroundColor: theme.colors.N900 }}>
          {/* @ts-expect-error */}
          <SideMenu menu={<Explorer />} edgeHitWidth={400}>
            <MessageSurface />
          </SideMenu>
        </View>
      </SafeAreaView>
    </NavigationContainer>
  );
}
