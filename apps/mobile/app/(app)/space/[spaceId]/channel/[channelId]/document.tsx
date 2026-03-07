import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { useMikoto } from '../../../../../../src/hooks/useMikoto';
import { env } from '../../../../../../src/env';
import { colors, fontSize, spacing } from '../../../../../../src/theme';

export default function DocumentScreen() {
  const { spaceId, channelId } = useLocalSearchParams<{
    spaceId: string;
    channelId: string;
  }>();
  const mikoto = useMikoto();
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const channel = mikoto.channels._get(channelId!);

  // The WebView loads the collaborative editor
  // For now we use a simple HTML-based editor
  // In production, this would load the Lexical editor from a hosted URL
  const editorHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          background: hsl(225, 12%, 15%);
          color: hsl(225, 20%, 97%);
          font-family: -apple-system, system-ui, sans-serif;
          font-size: 16px;
          line-height: 1.6;
          padding: 16px;
          min-height: 100vh;
        }
        #editor {
          outline: none;
          min-height: calc(100vh - 32px);
        }
        #editor:empty:before {
          content: 'Start writing...';
          color: hsl(225, 16%, 42%);
        }
        h1 { font-size: 24px; margin-bottom: 8px; }
        h2 { font-size: 20px; margin-bottom: 8px; }
        p { margin-bottom: 8px; }
        a { color: hsl(214, 92%, 70%); }
      </style>
    </head>
    <body>
      <div id="editor" contenteditable="true"></div>
      <script>
        const editor = document.getElementById('editor');
        editor.addEventListener('input', () => {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'content',
            content: editor.innerHTML,
          }));
        });
        window.addEventListener('message', (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.type === 'setContent') {
              editor.innerHTML = data.content;
            }
          } catch {}
        });
      </script>
    </body>
    </html>
  `;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.N0} />
        </Pressable>
        <Ionicons name="document-text-outline" size={18} color={colors.N400} />
        <Text style={styles.headerTitle} numberOfLines={1}>
          {channel?.name ?? 'Document'}
        </Text>
      </View>

      <WebView
        ref={webViewRef}
        source={{ html: editorHtml }}
        style={styles.webview}
        originWhitelist={['*']}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'content') {
              // Handle content changes - save to server
            }
          } catch {}
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.N1000,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.N800,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    flex: 1,
    color: colors.N0,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  webview: {
    flex: 1,
    backgroundColor: colors.N1000,
  },
});
