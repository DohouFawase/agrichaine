import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, RADIUS, SPACING } from '@/hooks/theme';
import type { UserPayload } from '@/types/home/homeType';

interface UserHeaderProps {
  user: UserPayload;
  roleLabel: string;
  accentColor: string;
  accentSoft: string;
  /** Nombre de notifications non lues. 0 ou undefined = pas de badge affiché. */
  unreadNotifications?: number;
  onNotificationPress?: () => void;
}

function getInitials(name: string, lastName: string): string {
  const a = name?.[0] ?? '';
  const b = lastName?.[0] ?? '';
  return `${a}${b}`.toUpperCase() || '?';
}

export default function UserHeader({
  user,
  roleLabel,
  accentColor,
  accentSoft,
  unreadNotifications = 0,
  onNotificationPress,
}: UserHeaderProps) {
  const hasUnread = unreadNotifications > 0;

  return (
    <View style={styles.container}>
      <View style={[styles.avatar, { backgroundColor: accentSoft }]}>
        <Text style={[styles.avatarText, { color: accentColor }]}>
          {getInitials(user.name, user.last_name)}
        </Text>
      </View>

      <View style={styles.infoBlock}>
        <Text style={styles.greeting}>Bonjour,</Text>
        <Text style={styles.name} numberOfLines={1}>
          {user.name} {user.last_name}
        </Text>
        <View style={[styles.roleBadge, { backgroundColor: accentSoft }]}>
          <Text style={[styles.roleBadgeText, { color: accentColor }]}>{roleLabel}</Text>
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onNotificationPress}
        style={[styles.bellButton, { backgroundColor: accentSoft }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="notifications-outline" size={22} color={accentColor} />
        {hasUnread && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    backgroundColor: COLORS.background,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    fontSize: FONT.size.lg,
    fontWeight: FONT.weight.bold,
  },
  infoBlock: {
    flex: 1,
  },
  greeting: {
    fontSize: FONT.size.sm,
    color: COLORS.textSecondary,
  },
  name: {
    fontSize: FONT.size.lg,
    fontWeight: FONT.weight.bold,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  roleBadgeText: {
    fontSize: FONT.size.xs,
    fontWeight: FONT.weight.semibold,
  },
  bellButton: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: FONT.weight.bold,
  },
});