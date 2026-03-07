import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useMikoto } from '../../../../../../src/hooks/useMikoto';
import { colors, borderRadius, fontSize, spacing } from '../../../../../../src/theme';

export default function VoiceChannelScreen() {
  const { spaceId, channelId } = useLocalSearchParams<{
    spaceId: string;
    channelId: string;
  }>();
  const mikoto = useMikoto();
  const router = useRouter();
  const channel = mikoto.channels._get(channelId!);

  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.N0} />
        </Pressable>
        <Ionicons name="volume-medium" size={18} color={colors.N400} />
        <Text style={styles.headerTitle} numberOfLines={1}>
          {channel?.name ?? 'Voice Channel'}
        </Text>
      </View>

      <View style={styles.content}>
        {isConnected ? (
          <View style={styles.connected}>
            <Text style={styles.statusText}>Connected to voice</Text>
            <Text style={styles.channelName}>{channel?.name}</Text>

            <View style={styles.participantList}>
              <Text style={styles.participantLabel}>Participants</Text>
              {/* LiveKit participant list would go here */}
              <Text style={styles.placeholder}>
                Voice participants will appear here when LiveKit is integrated
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.disconnected}>
            <View style={styles.voiceIcon}>
              <Ionicons name="volume-medium" size={48} color={colors.N400} />
            </View>
            <Text style={styles.channelName}>{channel?.name}</Text>
            <Text style={styles.description}>
              Join this voice channel to talk with others
            </Text>
          </View>
        )}
      </View>

      <View style={styles.controls}>
        {isConnected ? (
          <View style={styles.controlRow}>
            <Pressable
              style={[styles.controlButton, isMuted && styles.controlButtonActive]}
              onPress={() => setIsMuted(!isMuted)}
            >
              <Ionicons
                name={isMuted ? 'mic-off' : 'mic'}
                size={24}
                color={colors.N0}
              />
            </Pressable>

            <Pressable
              style={[styles.controlButton, isDeafened && styles.controlButtonActive]}
              onPress={() => setIsDeafened(!isDeafened)}
            >
              <Ionicons
                name={isDeafened ? 'volume-mute' : 'volume-medium'}
                size={24}
                color={colors.N0}
              />
            </Pressable>

            <Pressable
              style={[styles.controlButton, styles.disconnectButton]}
              onPress={() => setIsConnected(false)}
            >
              <Ionicons name="call" size={24} color={colors.N0} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={styles.joinButton}
            onPress={() => setIsConnected(true)}
          >
            <Ionicons name="call" size={20} color={colors.N0} />
            <Text style={styles.joinButtonText}>Join Voice</Text>
          </Pressable>
        )}
      </View>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disconnected: {
    alignItems: 'center',
    gap: spacing.md,
  },
  voiceIcon: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.full,
    backgroundColor: colors.N800,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  connected: {
    flex: 1,
    width: '100%',
    padding: spacing.lg,
  },
  statusText: {
    color: colors.G700,
    fontSize: fontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  channelName: {
    color: colors.N0,
    fontSize: fontSize.xl,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  description: {
    color: colors.N400,
    fontSize: fontSize.md,
    textAlign: 'center',
  },
  participantList: {
    marginTop: spacing.xl,
  },
  participantLabel: {
    color: colors.N400,
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  placeholder: {
    color: colors.N500,
    fontSize: fontSize.sm,
    fontStyle: 'italic',
  },
  controls: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.N800,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.N700,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonActive: {
    backgroundColor: colors.N600,
  },
  disconnectButton: {
    backgroundColor: colors.R700,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.G700,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  joinButtonText: {
    color: colors.N0,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});
