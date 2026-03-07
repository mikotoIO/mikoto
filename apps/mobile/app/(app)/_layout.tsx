import { Ionicons } from '@expo/vector-icons';
import type { MikotoSpace } from '@mikoto-io/mikoto.js';
import { Drawer } from 'expo-router/drawer';
import { useSnapshot } from 'valtio';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { LoadingScreen } from '../../src/components/LoadingScreen';
import { SpaceIcon } from '../../src/components/SpaceIcon';
import { useMikoto } from '../../src/hooks/useMikoto';
import { MikotoClientProvider } from '../../src/lib/MikotoClientProvider';
import { clearRefreshToken } from '../../src/lib/auth';
import { colors, fontSize, spacing, borderRadius } from '../../src/theme';

function DrawerContent() {
  const mikoto = useMikoto();
  const router = useRouter();
  const spacesSnap = useSnapshot(mikoto.spaces);
  const spaces = Array.from((spacesSnap as any).cache?.values?.() ?? []) as MikotoSpace[];

  return (
    <SafeAreaView style={styles.drawer}>
      <View style={styles.drawerHeader}>
        <Text style={styles.drawerTitle}>Mikoto</Text>
      </View>

      <ScrollView style={styles.drawerContent} showsVerticalScrollIndicator={false}>
        <Pressable
          style={styles.navItem}
          onPress={() => router.push('/(app)')}
        >
          <Ionicons name="home-outline" size={20} color={colors.N300} />
          <Text style={styles.navItemText}>Home</Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() => router.push('/(app)/friends')}
        >
          <Ionicons name="people-outline" size={20} color={colors.N300} />
          <Text style={styles.navItemText}>Friends</Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() => router.push('/(app)/discover')}
        >
          <Ionicons name="compass-outline" size={20} color={colors.N300} />
          <Text style={styles.navItemText}>Discover</Text>
        </Pressable>

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>SPACES</Text>

        {spaces.map((space) => (
          <Pressable
            key={space.id}
            style={styles.spaceItem}
            onPress={() => router.push(`/(app)/space/${space.id}`)}
          >
            <SpaceIcon name={space.name} icon={space.icon} />
            <Text style={styles.spaceName} numberOfLines={1}>
              {space.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.drawerFooter}>
        <Pressable
          style={styles.navItem}
          onPress={() => router.push('/(app)/settings')}
        >
          <Ionicons name="settings-outline" size={20} color={colors.N300} />
          <Text style={styles.navItemText}>Settings</Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={async () => {
            await clearRefreshToken();
            router.replace('/(auth)/login');
          }}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.R600} />
          <Text style={[styles.navItemText, { color: colors.R600 }]}>Log Out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function AppDrawer() {
  return (
    <Drawer
      drawerContent={() => <DrawerContent />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: colors.N900,
          width: 280,
        },
        sceneStyle: {
          backgroundColor: colors.N1000,
        },
      }}
    />
  );
}

export default function AppLayout() {
  const router = useRouter();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <MikotoClientProvider
        fallback={<LoadingScreen />}
        onError={() => {
          router.replace('/(auth)/login');
        }}
      >
        <AppDrawer />
      </MikotoClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  drawer: {
    flex: 1,
    backgroundColor: colors.N900,
  },
  drawerHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.N700,
  },
  drawerTitle: {
    color: colors.N0,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  drawerContent: {
    flex: 1,
    paddingTop: spacing.sm,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  navItemText: {
    color: colors.N300,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.N700,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
  },
  sectionTitle: {
    color: colors.N500,
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  spaceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  spaceName: {
    color: colors.N200,
    fontSize: fontSize.md,
    flex: 1,
  },
  drawerFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.N700,
    paddingVertical: spacing.sm,
  },
});
