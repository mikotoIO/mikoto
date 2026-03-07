import { Ionicons } from '@expo/vector-icons';
import type { MessageExt, MessageKey, MikotoMessage } from '@mikoto-io/mikoto.js';
import { MikotoMessage as MikotoMessageClass } from '@mikoto-io/mikoto.js';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MessageInput } from '../../../../../../src/components/MessageInput';
import { MessageItem } from '../../../../../../src/components/MessageItem';
import { useMikoto } from '../../../../../../src/hooks/useMikoto';
import { colors, fontSize, spacing } from '../../../../../../src/theme';

function isMessageSimple(
  message: MikotoMessage,
  prevMessage?: MikotoMessage,
): boolean {
  if (!prevMessage) return false;
  return (
    prevMessage.author?.id === message.author?.id &&
    new Date(message.timestamp).getTime() -
      new Date(prevMessage.timestamp).getTime() <
      5 * 60 * 1000
  );
}

export default function MessageScreen() {
  const { spaceId, channelId } = useLocalSearchParams<{
    spaceId: string;
    channelId: string;
  }>();
  const mikoto = useMikoto();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  const channel = mikoto.channels._get(channelId!);
  const [messages, setMessages] = useState<MikotoMessage[] | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allLoaded, setAllLoaded] = useState(false);

  // Load initial messages
  useEffect(() => {
    if (!channel) return;
    channel.listMessages(50, null).then((msgs) => {
      setMessages(msgs);
      if (msgs.length === 0) setAllLoaded(true);
    });
  }, [channelId]);

  // Real-time message events
  useEffect(() => {
    if (!channel) return;

    const onCreate = (msg: MessageExt) => {
      if (msg.channelId !== channelId) return;
      setMessages((prev) =>
        prev ? [...prev, new MikotoMessageClass(msg, mikoto)] : null,
      );
    };

    const onUpdate = (msg: MessageExt) => {
      if (msg.channelId !== channelId) return;
      setMessages((prev) =>
        prev
          ? prev.map((m) =>
              m.id === msg.id ? new MikotoMessageClass(msg, mikoto) : m,
            )
          : null,
      );
    };

    const onDelete = (key: MessageKey) => {
      if (key.channelId !== channelId) return;
      setMessages((prev) =>
        prev ? prev.filter((m) => m.id !== key.messageId) : null,
      );
    };

    mikoto.ws.on('messages.onCreate', onCreate);
    mikoto.ws.on('messages.onUpdate', onUpdate);
    mikoto.ws.on('messages.onDelete', onDelete);

    return () => {
      mikoto.ws.off('messages.onCreate', onCreate);
      mikoto.ws.off('messages.onUpdate', onUpdate);
      mikoto.ws.off('messages.onDelete', onDelete);
    };
  }, [channelId]);

  const loadMore = useCallback(async () => {
    if (!channel || !messages || messages.length === 0 || loadingMore || allLoaded)
      return;
    setLoadingMore(true);
    try {
      const older = await channel.listMessages(50, messages[0].id);
      if (older.length === 0) {
        setAllLoaded(true);
      } else {
        setMessages((prev) => (prev ? [...older, ...prev] : null));
      }
    } finally {
      setLoadingMore(false);
    }
  }, [channel, messages, loadingMore, allLoaded]);

  const handleSend = async (content: string) => {
    if (!channel) return;
    await channel.sendMessage(content, []);
  };

  const handleLongPress = (message: MikotoMessage) => {
    const isOwn = message.author?.id === mikoto.user.me?.id;
    const options = isOwn
      ? [
          { text: 'Edit', onPress: () => handleEdit(message) },
          {
            text: 'Delete',
            style: 'destructive' as const,
            onPress: () => handleDelete(message),
          },
          { text: 'Cancel', style: 'cancel' as const },
        ]
      : [{ text: 'Cancel', style: 'cancel' as const }];

    Alert.alert('Message', undefined, options);
  };

  const handleEdit = async (message: MikotoMessage) => {
    Alert.prompt?.(
      'Edit Message',
      undefined,
      async (newContent) => {
        if (newContent) await message.edit(newContent);
      },
      'plain-text',
      message.content,
    );
  };

  const handleDelete = async (message: MikotoMessage) => {
    Alert.alert('Delete Message', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => message.delete(),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.N0} />
        </Pressable>
        <Ionicons name="chatbubble-outline" size={18} color={colors.N400} />
        <Text style={styles.headerTitle} numberOfLines={1}>
          {channel?.name ?? 'Channel'}
        </Text>
        <Pressable
          onPress={() =>
            router.push(
              `/(app)/space/${spaceId}/channel/${channelId}/settings`,
            )
          }
          style={styles.settingsButton}
        >
          <Ionicons name="settings-outline" size={20} color={colors.N300} />
        </Pressable>
      </View>

      <View style={styles.content}>
        {messages === null ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.B600} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            inverted={false}
            onEndReachedThreshold={0.1}
            onStartReached={loadMore}
            onStartReachedThreshold={0.5}
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
            }}
            ListHeaderComponent={
              loadingMore ? (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color={colors.B600} />
                </View>
              ) : allLoaded ? (
                <View style={styles.channelHead}>
                  <Text style={styles.channelHeadTitle}>
                    Welcome to #{channel?.name}!
                  </Text>
                  <Text style={styles.channelHeadSub}>
                    This is the start of the channel.
                  </Text>
                </View>
              ) : null
            }
            renderItem={({ item, index }) => (
              <MessageItem
                message={item}
                isSimple={isMessageSimple(item, messages[index - 1])}
                onLongPress={() => handleLongPress(item)}
              />
            )}
            onContentSizeChange={() => {
              if (messages.length > 0 && !loadingMore) {
                flatListRef.current?.scrollToEnd({ animated: false });
              }
            }}
          />
        )}
      </View>

      <MessageInput
        placeholder={`Message #${channel?.name ?? 'channel'}`}
        onSubmit={handleSend}
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
  settingsButton: {
    padding: spacing.xs,
  },
  content: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingMore: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  channelHead: {
    padding: spacing.xl,
    paddingTop: spacing.xxl,
  },
  channelHeadTitle: {
    color: colors.N0,
    fontSize: fontSize.xxl,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  channelHeadSub: {
    color: colors.N400,
    fontSize: fontSize.md,
  },
});
