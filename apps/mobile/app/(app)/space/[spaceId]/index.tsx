import { Ionicons } from '@expo/vector-icons';
import type { Channel } from '@mikoto-io/mikoto.js';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSnapshot } from 'valtio';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChannelList } from '../../../../src/components/ChannelList';
import { useMikoto } from '../../../../src/hooks/useMikoto';
import { colors, fontSize, spacing } from '../../../../src/theme';

export default function SpaceHomeScreen() {
  const { spaceId } = useLocalSearchParams<{ spaceId: string }>();
  const mikoto = useMikoto();
  const router = useRouter();
  const channelsSnap = useSnapshot(mikoto.channels);

  const space = mikoto.spaces._get(spaceId!);
  const allChannels = Array.from(
    (channelsSnap as any).cache?.values?.() ?? [],
  ) as Channel[];
  const channels = allChannels.filter((c) => c.spaceId === spaceId);

  const handleChannelPress = (channel: Channel) => {
    if (channel.type === 'CATEGORY') return;

    const routeType =
      channel.type === 'VOICE'
        ? 'voice'
        : channel.type === 'DOCUMENT'
          ? 'document'
          : 'index';

    if (routeType === 'index') {
      router.push(`/(app)/space/${spaceId}/channel/${channel.id}`);
    } else {
      router.push(`/(app)/space/${spaceId}/channel/${channel.id}/${routeType}`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.N0} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {space?.name ?? 'Space'}
        </Text>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() =>
              router.push(`/(app)/space/${spaceId}/search`)
            }
            style={styles.actionButton}
          >
            <Ionicons name="search" size={20} color={colors.N300} />
          </Pressable>
          <Pressable
            onPress={() =>
              router.push(`/(app)/space/${spaceId}/members`)
            }
            style={styles.actionButton}
          >
            <Ionicons name="people" size={20} color={colors.N300} />
          </Pressable>
          <Pressable
            onPress={() =>
              router.push(`/(app)/space/${spaceId}/settings`)
            }
            style={styles.actionButton}
          >
            <Ionicons name="settings-outline" size={20} color={colors.N300} />
          </Pressable>
        </View>
      </View>

      <ChannelList
        channels={channels}
        onChannelPress={handleChannelPress}
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
    marginLeft: spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionButton: {
    padding: spacing.xs,
  },
});
