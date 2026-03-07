import type { MemberExt } from '@mikoto-io/mikoto.js';
import { StyleSheet, Text, View } from 'react-native';

import { Avatar } from './Avatar';
import { colors, fontSize, spacing } from '../theme';

interface MemberItemProps {
  member: MemberExt;
}

export function MemberItem({ member }: MemberItemProps) {
  return (
    <View style={styles.container}>
      <Avatar uri={member.user?.avatar} name={member.user?.name} size={36} rounded />
      <View style={styles.info}>
        <Text style={styles.name}>{member.user?.name ?? 'Unknown'}</Text>
        {member.roleIds && member.roleIds.length > 0 && (
          <Text style={styles.role} numberOfLines={1}>
            {member.roleIds.length} role{member.roleIds.length !== 1 ? 's' : ''}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  info: {
    flex: 1,
  },
  name: {
    color: colors.N0,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  role: {
    color: colors.N400,
    fontSize: fontSize.sm,
  },
});
