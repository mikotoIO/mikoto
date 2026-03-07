import { Ionicons } from '@expo/vector-icons';
import type { Channel } from '@mikoto-io/mikoto.js';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, spacing, borderRadius } from '../theme';

type ChannelType = 'TEXT' | 'VOICE' | 'DOCUMENT' | 'CATEGORY' | string;

function channelIcon(type: ChannelType): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'TEXT':
      return 'chatbubble-outline';
    case 'VOICE':
      return 'volume-medium-outline';
    case 'DOCUMENT':
      return 'document-text-outline';
    case 'CATEGORY':
      return 'folder-outline';
    default:
      return 'chatbubble-outline';
  }
}

interface ChannelItemProps {
  channel: Channel;
  isActive?: boolean;
  onPress: () => void;
}

function ChannelItem({ channel, isActive, onPress }: ChannelItemProps) {
  const isCategory = channel.type === 'CATEGORY';

  if (isCategory) {
    return (
      <View style={styles.categoryContainer}>
        <Text style={styles.categoryText}>{channel.name.toUpperCase()}</Text>
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={[styles.channelItem, isActive && styles.channelItemActive]}
    >
      <Ionicons
        name={channelIcon(channel.type)}
        size={18}
        color={isActive ? colors.N0 : colors.N400}
      />
      <Text
        style={[styles.channelName, isActive && styles.channelNameActive]}
        numberOfLines={1}
      >
        {channel.name}
      </Text>
    </Pressable>
  );
}

interface ChannelListProps {
  channels: Channel[];
  activeChannelId?: string;
  onChannelPress: (channel: Channel) => void;
}

export function ChannelList({
  channels,
  activeChannelId,
  onChannelPress,
}: ChannelListProps) {
  // Sort channels: categories first with their children grouped
  const sortedChannels = [...channels].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {sortedChannels.map((channel) => (
        <ChannelItem
          key={channel.id}
          channel={channel}
          isActive={channel.id === activeChannelId}
          onPress={() => onChannelPress(channel)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  categoryContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
  },
  categoryText: {
    color: colors.N400,
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  channelItemActive: {
    backgroundColor: colors.N700,
  },
  channelName: {
    color: colors.N300,
    fontSize: fontSize.md,
    flex: 1,
  },
  channelNameActive: {
    color: colors.N0,
    fontWeight: '500',
  },
});
