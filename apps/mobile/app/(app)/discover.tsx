import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';

import { Avatar } from '../../src/components/Avatar';
import { EmptyState } from '../../src/components/EmptyState';
import { useMikoto } from '../../src/hooks/useMikoto';
import { colors, borderRadius, fontSize, spacing } from '../../src/theme';

interface PublicSpace {
  id: string;
  name: string;
  icon?: string | null;
  description?: string;
  memberCount?: number;
}

export default function DiscoverScreen() {
  const mikoto = useMikoto();
  const router = useRouter();
  const navigation = useNavigation();
  const [spaces, setSpaces] = useState<PublicSpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadSpaces();
  }, []);

  const loadSpaces = async () => {
    try {
      // Discovery endpoint not yet available in the API
      // Placeholder - will be implemented when the backend adds a public spaces list
      setSpaces([]);
    } catch {
      // Discovery may not be available
    } finally {
      setLoading(false);
    }
  };

  const filteredSpaces = spaces.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
          style={styles.menuButton}
        >
          <Ionicons name="menu" size={24} color={colors.N0} />
        </Pressable>
        <Text style={styles.headerTitle}>Discover</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={colors.N400} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search communities..."
          placeholderTextColor={colors.N500}
          selectionColor={colors.B500}
        />
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.B600} />
        </View>
      ) : (
        <FlatList
          data={filteredSpaces}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState message="No public spaces found. Check back later!" />
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.spaceCard}
              onPress={() => router.push(`/(app)/space/${item.id}`)}
            >
              <Avatar uri={item.icon} name={item.name} size={48} rounded />
              <View style={styles.spaceInfo}>
                <Text style={styles.spaceName}>{item.name}</Text>
                {item.description && (
                  <Text style={styles.spaceDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
              </View>
            </Pressable>
          )}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.N800,
    margin: spacing.md,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.N0,
    fontSize: fontSize.md,
    paddingVertical: spacing.sm,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: spacing.md,
  },
  spaceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.N900,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  spaceInfo: {
    flex: 1,
  },
  spaceName: {
    color: colors.N0,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  spaceDesc: {
    color: colors.N400,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
});
