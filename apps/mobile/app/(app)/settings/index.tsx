import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSnapshot } from 'valtio';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';

import { Avatar } from '../../../src/components/Avatar';
import { useMikoto } from '../../../src/hooks/useMikoto';
import { clearRefreshToken } from '../../../src/lib/auth';
import { colors, borderRadius, fontSize, spacing } from '../../../src/theme';

interface SettingsItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
}

function SettingsItem({ icon, label, onPress, color }: SettingsItemProps) {
  return (
    <Pressable style={styles.settingsItem} onPress={onPress}>
      <Ionicons name={icon} size={22} color={color ?? colors.N300} />
      <Text style={[styles.settingsLabel, color ? { color } : undefined]}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={18} color={colors.N500} />
    </Pressable>
  );
}

export default function AccountSettingsScreen() {
  const mikoto = useMikoto();
  const router = useRouter();
  const navigation = useNavigation();
  const userSnap = useSnapshot(mikoto.user);
  const me = (userSnap as any).me;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
          style={styles.menuButton}
        >
          <Ionicons name="menu" size={24} color={colors.N0} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        <Pressable
          style={styles.profileCard}
          onPress={() => router.push('/(app)/settings/profile')}
        >
          <Avatar uri={me?.avatar} name={me?.name} size={56} rounded />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{me?.name ?? 'User'}</Text>
            <Text style={styles.profileEmail}>{me?.handle ?? ''}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.N500} />
        </Pressable>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <SettingsItem
            icon="person-outline"
            label="Edit Profile"
            onPress={() => router.push('/(app)/settings/profile')}
          />
          <SettingsItem
            icon="lock-closed-outline"
            label="Change Password"
            onPress={() => {}}
          />
          <SettingsItem
            icon="notifications-outline"
            label="Notifications"
            onPress={() => {}}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App</Text>
          <SettingsItem
            icon="color-palette-outline"
            label="Appearance"
            onPress={() => {}}
          />
          <SettingsItem
            icon="language-outline"
            label="Language"
            onPress={() => {}}
          />
        </View>

        <View style={styles.section}>
          <SettingsItem
            icon="log-out-outline"
            label="Log Out"
            color={colors.R600}
            onPress={async () => {
              await clearRefreshToken();
              router.replace('/(auth)/login');
            }}
          />
        </View>

        <Text style={styles.version}>Mikoto Mobile v1.0.0</Text>
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
  content: {
    flex: 1,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.N900,
    margin: spacing.md,
    borderRadius: borderRadius.lg,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: colors.N0,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  profileEmail: {
    color: colors.N400,
    fontSize: fontSize.sm,
  },
  section: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    color: colors.N400,
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  settingsLabel: {
    flex: 1,
    color: colors.N200,
    fontSize: fontSize.md,
  },
  version: {
    color: colors.N500,
    fontSize: fontSize.xs,
    textAlign: 'center',
    paddingVertical: spacing.xxl,
  },
});
