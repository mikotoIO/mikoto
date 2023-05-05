import {
  StyleSheet,
  SafeAreaView as SAV,
  Platform,
  StatusBar,
} from 'react-native';

const styles = StyleSheet.create({
  androidSafeArea: {
    flex: 1,
    backgroundColor: 'white',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
});

export function SafeAreaView(props: { children: React.ReactNode }) {
  return <SAV style={styles.androidSafeArea}>{props.children}</SAV>;
}
