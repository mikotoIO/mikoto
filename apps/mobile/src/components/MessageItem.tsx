import type { MikotoMessage } from '@mikoto-io/mikoto.js';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from './Avatar';
import { colors, fontSize, spacing } from '../theme';

interface MessageItemProps {
  message: MikotoMessage;
  isSimple?: boolean;
  onLongPress?: () => void;
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return `Today at ${formatTime(timestamp)}`;
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${formatTime(timestamp)}`;
  }
  return `${date.toLocaleDateString()} ${formatTime(timestamp)}`;
}

export function MessageItem({ message, isSimple, onLongPress }: MessageItemProps) {
  if (isSimple) {
    return (
      <Pressable onLongPress={onLongPress} style={styles.simpleContainer}>
        <View style={styles.simpleGutter} />
        <Text style={styles.content}>{message.content}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable onLongPress={onLongPress} style={styles.container}>
      <Avatar
        uri={message.author?.avatar}
        name={message.author?.name}
        size={40}
        rounded
      />
      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={styles.name}>{message.author?.name ?? 'Unknown'}</Text>
          <Text style={styles.timestamp}>{formatDate(message.timestamp)}</Text>
        </View>
        <Text style={styles.content}>{message.content}</Text>
        {message.attachments && message.attachments.length > 0 && (
          <View style={styles.attachments}>
            {message.attachments.map((att, i) => (
              <Text key={i} style={styles.attachmentText}>
                📎 {att.filename}
              </Text>
            ))}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    gap: spacing.sm,
  },
  simpleContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: 1,
    gap: spacing.sm,
  },
  simpleGutter: {
    width: 40,
  },
  body: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  name: {
    color: colors.N0,
    fontWeight: '600',
    fontSize: fontSize.md,
  },
  timestamp: {
    color: colors.N500,
    fontSize: fontSize.xs,
  },
  content: {
    color: colors.N200,
    fontSize: fontSize.md,
    lineHeight: 22,
  },
  attachments: {
    marginTop: spacing.xs,
  },
  attachmentText: {
    color: colors.B500,
    fontSize: fontSize.sm,
  },
});
