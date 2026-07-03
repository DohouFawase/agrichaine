import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
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
  /** Texte affiché sous la salutation. */
  subtitle?: string;
  /** Placeholder de la barre de recherche. */
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (text: string) => void;
  onSearchSubmit?: (text: string) => void;
  onMicPress?: () => void;
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
  subtitle = 'What would you like to get today?',
  searchPlaceholder = 'Search for groceries..',
  searchValue,
  onSearchChange,
  onSearchSubmit,
  onMicPress,
}: UserHeaderProps) {
  const hasUnread = unreadNotifications > 0;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.infoBlock}>
          <Text style={styles.greeting} numberOfLines={1}>
            Hello <Text style={styles.name}>{user.name}</Text>
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onNotificationPress}
          style={[styles.bellButton, { backgroundColor: accentSoft }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="notifications-outline" size={20} color={accentColor} />
          {hasUnread && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={[styles.avatar, { backgroundColor: accentSoft }]}>
          <Text style={[styles.avatarText, { color: accentColor }]}>
            {getInitials(user.name, user.last_name)}
          </Text>
        </View>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder={searchPlaceholder}
          placeholderTextColor={COLORS.textSecondary}
          value={searchValue}
          onChangeText={onSearchChange}
          onSubmitEditing={(e) => onSearchSubmit?.(e.nativeEvent.text)}
          returnKeyType="search"
        />
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onMicPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="mic-outline" size={20} color={accentColor} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    backgroundColor: COLORS.background,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  infoBlock: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  greeting: {
    fontSize: FONT.size.lg,
    fontWeight: FONT.weight.bold,
    color: COLORS.textPrimary,
  },
  name: {
    fontSize: FONT.size.lg,
    fontWeight: FONT.weight.bold,
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: FONT.size.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  bellButton: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: FONT.weight.bold,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.bold,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface ?? COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    height: 46,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: FONT.size.sm,
    color: COLORS.textPrimary,
  },
});