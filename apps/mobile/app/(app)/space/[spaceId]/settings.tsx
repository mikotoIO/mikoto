import { Ionicons } from '@expo/vector-icons';
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

import { Avatar } from '../../../../src/components/Avatar';
import { useMikoto } from '../../../../src/hooks/useMikoto';
import { colors, borderRadius, fontSize, spacing } from '../../../../src/theme';

export default function SpaceSettingsScreen() {
  const { spaceId } = useLocalSearchParams<{ spaceId: string }>();
  const mikoto = useMikoto();
  const router = useRouter();
  const space = mikoto.spaces._get(spaceId!);

  const [name, setName] = useState(space?.name ?? '');

  const handleSave = async () => {
    if (!space) return;
    try {
      await mikoto.rest['spaces.update'](
        { name },
        { params: { spaceId: spaceId! } },
      );
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to update space');
    }
  };

  const handleLeave = () => {
    Alert.alert('Leave Space', `Are you sure you want to leave ${space?.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          try {
            await mikoto.rest['spaces.leave'](undefined, {
              params: { spaceId: spaceId! },
            });
            router.replace('/(app)');
          } catch {
            Alert.alert('Error', 'Failed to leave space');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.N0} />
        </Pressable>
        <Text style={styles.headerTitle}>Space Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.spaceInfo}>
          <Avatar uri={space?.icon} name={space?.name} size={72} rounded />
          <Text style={styles.spaceId}>ID: {spaceId}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Space Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholderTextColor={colors.N500}
            selectionColor={colors.B500}
          />
        </View>

        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </Pressable>

        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          <Pressable style={styles.leaveButton} onPress={handleLeave}>
            <Ionicons name="exit-outline" size={18} color={colors.R600} />
            <Text style={styles.leaveButtonText}>Leave Space</Text>
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
  spaceInfo: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  spaceId: {
    color: colors.N500,
    fontSize: fontSize.xs,
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
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.R800,
  },
  leaveButtonText: {
    color: colors.R600,
    fontSize: fontSize.md,
  },
});
