import { Ionicons } from '@expo/vector-icons';
import { checkPermission, permissions } from '@mikoto-io/permcheck';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useMikoto } from '../../../../../../src/hooks/useMikoto';
import { colors, borderRadius, fontSize, spacing } from '../../../../../../src/theme';

export default function ChannelSettingsScreen() {
  const { spaceId, channelId } = useLocalSearchParams<{
    spaceId: string;
    channelId: string;
  }>();
  const mikoto = useMikoto();
  const router = useRouter();
  const channel = mikoto.channels._get(channelId!);

  const [name, setName] = useState(channel?.name ?? '');

  const handleSave = async () => {
    if (!channel) return;
    try {
      await mikoto.rest['channels.update'](
        { name },
        { params: { spaceId: spaceId!, channelId: channelId! } },
      );
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Failed to update channel');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Channel',
      `Are you sure you want to delete #${channel?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await mikoto.rest['channels.delete'](undefined, {
                params: { spaceId: spaceId!, channelId: channelId! },
              });
              router.back();
              router.back();
            } catch {
              Alert.alert('Error', 'Failed to delete channel');
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.N0} />
        </Pressable>
        <Text style={styles.headerTitle}>Channel Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Channel Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholderTextColor={colors.N500}
            selectionColor={colors.B500}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Channel Type</Text>
          <Text style={styles.typeText}>{channel?.type ?? 'Unknown'}</Text>
        </View>

        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </Pressable>

        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          <Pressable style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color={colors.R600} />
            <Text style={styles.deleteButtonText}>Delete Channel</Text>
          </Pressable>
        </View>
      </ScrollView>
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
    color: colors.N0,
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    color: colors.N300,
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.N800,
    color: colors.N0,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    borderWidth: 1,
    borderColor: colors.N600,
  },
  typeText: {
    color: colors.N200,
    fontSize: fontSize.md,
  },
  saveButton: {
    backgroundColor: colors.B700,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  saveButtonText: {
    color: colors.N0,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  dangerZone: {
    borderTopWidth: 1,
    borderTopColor: colors.N700,
    paddingTop: spacing.lg,
  },
  dangerTitle: {
    color: colors.R600,
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginBottom: spacing.md,
    textTransform: 'uppercase',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.R800,
  },
  deleteButtonText: {
    color: colors.R600,
    fontSize: fontSize.md,
  },
});
