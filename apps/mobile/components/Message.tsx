import { Image, StyleSheet, Text, View } from 'react-native';

import { theme } from '../lucid/theme';

const placeholderImg =
  'https://cdn.alpha.mikoto.io/avatar/a7f2d3e3-91d0-4bb5-9432-4cd1499a40e6.png';

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    flexGrow: 1,
    width: '100%',
  },
  content: {
    // color: theme.colors.N0,
  },
  avatar: {
    width: 40,
    height: 40,
    marginRight: 8,
    borderRadius: 4,
  },
  name: {
    color: theme.colors.N0,
    fontWeight: 'bold',
  },
  text: {
    color: theme.colors.N0,
  },
});

export function Message() {
  return (
    <View style={styles.base}>
      <Image
        style={styles.avatar}
        source={{
          uri: placeholderImg,
        }}
      />
      <View style={styles.content}>
        <Text style={styles.name}>CactusBlue</Text>
        <Text style={styles.text}>This is a message!!!</Text>
      </View>
    </View>
  );
}
