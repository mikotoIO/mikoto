import { Ionicons } from '@expo/vector-icons';
import type { MemberExt } from '@mikoto-io/mikoto.js';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '../../../../src/components/EmptyState';
import { MemberItem } from '../../../../src/components/MemberItem';
import { useMikoto } from '../../../../src/hooks/useMikoto';
import { colors, fontSize, spacing } from '../../../../src/theme';

export default function MembersScreen() {
  const { spaceId } = useLocalSearchParams<{ spaceId: string }>();
  const mikoto = useMikoto();
  const router = useRouter();
  const [members, setMembers] = useState<MemberExt[] | null>(null);

  useEffect(() => {
    mikoto.rest['members.list']({
      params: { spaceId: spaceId! },
    }).then(setMembers);
  }, [spaceId]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.N0} />
        </Pressable>
        <Text style={styles.headerTitle}>Members</Text>
        {members && (
          <Text style={styles.memberCount}>{members.length}</Text>
        )}
      </View>

      {members === null ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.B600} />
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<EmptyState message="No members found" />}
          renderItem={({ item }) => <MemberItem member={item} />}
        />
      )}
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
  memberCount: {
    color: colors.N400,
    fontSize: fontSize.sm,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
