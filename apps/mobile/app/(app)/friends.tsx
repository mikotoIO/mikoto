import { Ionicons } from '@expo/vector-icons';
import type { MikotoRelationship } from '@mikoto-io/mikoto.js';
import { useSnapshot } from 'valtio';
import { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';

import { Avatar } from '../../src/components/Avatar';
import { EmptyState } from '../../src/components/EmptyState';
import { useMikoto } from '../../src/hooks/useMikoto';
import { colors, borderRadius, fontSize, spacing } from '../../src/theme';

type TabType = 'friends' | 'pending' | 'blocked';

function FriendItem({ relationship }: { relationship: MikotoRelationship }) {
  return (
    <View style={styles.friendItem}>
      <Avatar
        name={relationship.relationId.slice(0, 4)}
        size={40}
        rounded
      />
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>
          {relationship.relationId.slice(0, 8)}
        </Text>
        <Text style={styles.friendStatus}>{relationship.state}</Text>
      </View>
    </View>
  );
}

export default function FriendsScreen() {
  const mikoto = useMikoto();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<TabType>('friends');

  const relationshipsSnap = useSnapshot(mikoto.relationships);
  const allRelationships = Array.from(
    (relationshipsSnap as any).cache?.values?.() ?? [],
  ) as MikotoRelationship[];

  const filtered = allRelationships.filter((r) => {
    switch (activeTab) {
      case 'friends':
        return r.state === 'FRIEND';
      case 'pending':
        return r.state === 'INCOMING_REQUEST' || r.state === 'OUTGOING_REQUEST';
      case 'blocked':
        return r.state === 'BLOCKED';
      default:
        return false;
    }
  });

  const tabs: { key: TabType; label: string }[] = [
    { key: 'friends', label: 'Friends' },
    { key: 'pending', label: 'Pending' },
    { key: 'blocked', label: 'Blocked' },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
          style={styles.menuButton}
        >
          <Ionicons name="menu" size={24} color={colors.N0} />
        </Pressable>
        <Text style={styles.headerTitle}>Friends</Text>
      </View>

      <View style={styles.tabs}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <EmptyState
            message={
              activeTab === 'friends'
                ? 'No friends yet. Add some!'
                : activeTab === 'pending'
                  ? 'No pending requests'
                  : 'No blocked users'
            }
          />
        }
        renderItem={({ item }) => <FriendItem relationship={item} />}
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.N800,
  },
  menuButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    flex: 1,
    color: colors.N0,
    fontSize: fontSize.xl,
    fontWeight: '600',
    marginLeft: spacing.md,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.N800,
  },
  tabActive: {
    backgroundColor: colors.B700,
  },
  tabText: {
    color: colors.N400,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.N0,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    color: colors.N0,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  friendStatus: {
    color: colors.N400,
    fontSize: fontSize.sm,
  },
});
