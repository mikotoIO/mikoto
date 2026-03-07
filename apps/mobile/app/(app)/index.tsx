import { Ionicons } from '@expo/vector-icons';
import type { MikotoSpace } from '@mikoto-io/mikoto.js';
import { useRouter } from 'expo-router';
import { useSnapshot } from 'valtio';
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

function SpaceCard({ space, onPress }: { space: MikotoSpace; onPress: () => void }) {
  return (
    <Pressable style={styles.spaceCard} onPress={onPress}>
      <Avatar uri={space.icon} name={space.name} size={56} rounded />
      <Text style={styles.spaceName} numberOfLines={1}>
        {space.name}
      </Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const mikoto = useMikoto();
  const router = useRouter();
  const navigation = useNavigation();
  const spacesSnap = useSnapshot(mikoto.spaces);
  const spaces = Array.from((spacesSnap as any).cache?.values?.() ?? []) as MikotoSpace[];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
          style={styles.menuButton}
        >
          <Ionicons name="menu" size={24} color={colors.N0} />
        </Pressable>
        <Text style={styles.headerTitle}>Spaces</Text>
        <View style={styles.headerRight} />
      </View>

      <FlatList
        data={spaces}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        ListEmptyComponent={
          <EmptyState message="No spaces yet. Join or create one to get started!" />
        }
        renderItem={({ item }) => (
          <SpaceCard
            space={item}
            onPress={() => router.push(`/(app)/space/${item.id}`)}
          />
        )}
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
  headerRight: {
    width: 32,
  },
  grid: {
    padding: spacing.md,
  },
  row: {
    gap: spacing.sm,
  },
  spaceCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.N900,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    maxWidth: '33%',
  },
  spaceName: {
    color: colors.N200,
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
