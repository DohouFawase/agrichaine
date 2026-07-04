import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, RADIUS, SPACING } from '@/hooks/theme';
import type { AppNotification } from '@/providers/notification/notificationsProvideraction';

interface NotificationsDropdownProps {
  visible: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  isLoading: boolean;
  accentColor: string;
  accentSoft: string;
  onNotificationPress: (notification: AppNotification) => void;
  onSeeMore: () => void;
}

const MAX_VISIBLE_ITEMS = 6;

// ─────────────────────────────────────────────
// Formatage relatif simple (sans dépendance externe)
// ─────────────────────────────────────────────
function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  if (diffHour < 24) return `il y a ${diffHour} h`;
  if (diffDay < 7) return `il y a ${diffDay} j`;
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

// ─────────────────────────────────────────────
// Icône selon le type de notification — même logique que dans
// NotificationListScreen, pour rester cohérent entre le popup et la liste
// complète. Ajuste les valeurs du switch si tes vraies chaînes `type`
// backend diffèrent.
// ─────────────────────────────────────────────
function getIconForNotificationType(type: string | undefined): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'order_placed':
    case 'order':
      return 'cart-outline';
    case 'driver_assigned':
    case 'delivery':
    case 'transporter':
      return 'car-outline';
    case 'product_created':
    case 'product':
    default:
      return 'cube-outline';
  }
}

function NotificationItem({
  notification,
  accentColor,
  accentSoft,
  onPress,
}: {
  notification: AppNotification;
  accentColor: string;
  accentSoft: string;
  onPress: () => void;
}) {
  const isUnread = notification.read_at === null;
  const iconName = getIconForNotificationType(notification.data.type);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.item, isUnread && styles.itemUnread]}
    >
      <View style={[styles.itemIcon, { backgroundColor: accentSoft }]}>
        <Ionicons name={iconName} size={18} color={accentColor} />
      </View>

      <View style={styles.itemBody}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {notification.data.title}
        </Text>
        <Text style={styles.itemMessage} numberOfLines={2}>
          {notification.data.message}
        </Text>
        <Text style={styles.itemTime}>{timeAgo(notification.created_at)}</Text>
      </View>

      {isUnread && <View style={[styles.dot, { backgroundColor: accentColor }]} />}
    </TouchableOpacity>
  );
}

export default function NotificationsDropdown({
  visible,
  onClose,
  notifications,
  isLoading,
  accentColor,
  accentSoft,
  onNotificationPress,
  onSeeMore,
}: NotificationsDropdownProps) {
  const visibleNotifications = notifications.slice(0, MAX_VISIBLE_ITEMS);
  const hasMoreThanVisible = notifications.length > MAX_VISIBLE_ITEMS;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.panel} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Notifications</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {isLoading && notifications.length === 0 ? (
            <View style={styles.centered}>
              <ActivityIndicator size="small" color={accentColor} />
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.centered}>
              <Ionicons name="notifications-off-outline" size={28} color={COLORS.textSecondary} />
              <Text style={styles.emptyText}>Aucune notification pour le moment.</Text>
            </View>
          ) : (
            <FlatList
              data={visibleNotifications}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <NotificationItem
                  notification={item}
                  accentColor={accentColor}
                  accentSoft={accentSoft}
                  onPress={() => onNotificationPress(item)}
                />
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              style={styles.list}
              showsVerticalScrollIndicator={false}
            />
          )}

          {notifications.length > 0 && (
            <TouchableOpacity style={styles.seeMoreButton} onPress={onSeeMore} activeOpacity={0.7}>
              {/*
                ✅ CORRECTION : on précise "X sur Y" dès qu'il y a plus de
                notifications que ce qui est affiché ici. Ça évite la
                confusion "le badge dit 15 mais je n'en vois que 6".
              */}
              <Text style={[styles.seeMoreText, { color: accentColor }]}>
                {hasMoreThanVisible
                  ? `Voir toutes les notifications (${visibleNotifications.length} sur ${notifications.length})`
                  : 'Voir toutes les notifications'}
              </Text>
            </TouchableOpacity>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'flex-end',
  },
  panel: {
    marginTop: 90,
    marginRight: SPACING.md,
    width: 320,
    maxHeight: 420,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border ?? '#E5E5E5',
  },
  headerTitle: {
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.bold,
    color: COLORS.textPrimary,
  },
  centered: {
    paddingVertical: SPACING.xl ?? 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: SPACING.xs,
    fontSize: FONT.size.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
  },
  list: {
    maxHeight: 340,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  itemUnread: {
    backgroundColor: COLORS.background ?? '#F7F7F7',
  },
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  itemBody: {
    flex: 1,
  },
  itemTitle: {
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
    color: COLORS.textPrimary,
  },
  itemMessage: {
    fontSize: FONT.size.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  itemTime: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: SPACING.xs,
    marginTop: 6,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border ?? '#E5E5E5',
    marginLeft: SPACING.md + 32 + SPACING.sm,
  },
  seeMoreButton: {
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border ?? '#E5E5E5',
  },
  seeMoreText: {
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
  },
});