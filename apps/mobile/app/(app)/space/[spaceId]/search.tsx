import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '../../../../src/components/EmptyState';
import { useMikoto } from '../../../../src/hooks/useMikoto';
import { colors, borderRadius, fontSize, spacing } from '../../../../src/theme';

interface SearchResult {
  id: string;
  content: string;
  channelName: string;
  authorName: string;
  timestamp: string;
}

export default function SearchScreen() {
  const { spaceId } = useLocalSearchParams<{ spaceId: string }>();
  const mikoto = useMikoto();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearched(true);
    // Search API would go here
    // For now, show empty state
    setResults([]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.N0} />
        </Pressable>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.N400} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search messages..."
            placeholderTextColor={colors.N500}
            selectionColor={colors.B500}
            autoFocus
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
        </View>
      </View>

      {searched ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <EmptyState message="No results found. Try a different search." />
          }
          renderItem={({ item }) => (
            <View style={styles.resultItem}>
              <Text style={styles.resultChannel}>#{item.channelName}</Text>
              <Text style={styles.resultContent}>{item.content}</Text>
              <Text style={styles.resultMeta}>
                {item.authorName} - {new Date(item.timestamp).toLocaleDateString()}
              </Text>
            </View>
          )}
        />
      ) : (
        <EmptyState message="Search for messages in this space" />
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
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.N800,
    gap: spacing.sm,
  },
  backButton: {
    padding: spacing.xs,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.N800,
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
  resultItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.N800,
  },
  resultChannel: {
    color: colors.B500,
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  resultContent: {
    color: colors.N200,
    fontSize: fontSize.md,
  },
  resultMeta: {
    color: colors.N500,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
});
