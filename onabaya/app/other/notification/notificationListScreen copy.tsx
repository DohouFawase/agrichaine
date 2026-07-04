import React, { useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SectionList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import type { AppDispatch } from '@/stores';
import { COLORS, FONT, RADIUS, SPACING } from '@/hooks/theme';
import EmptyState from '@/components/Emptystate';
import {
  fetchNotifications,
  fetchNotificationDetail,
  deleteNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/providers/notification/notificationsProvideraction';
import type { AppNotification } from '@/providers/notification/notificationsProvideraction';
import {
  selectNotifications,
  selectNotificationsLoading,
  selectNotificationsHasMore,
  selectNotificationsCurrentPage,
  selectNotificationsUnreadCount,
  selectSelectionMode,
  selectSelectedIds,
  selectIsDeleting,
  enterSelectionMode,
  exitSelectionMode,
  toggleSelectNotification,
  selectAllNotifications,
  deselectAllNotifications,
} from '@/slice/notificationSlice';

// ⚠️ Cet écran suppose que react-native-gesture-handler est déjà installé
// et que ton App racine est bien enveloppée dans <GestureHandlerRootView>
// (c'est déjà nécessaire pour React Navigation dans la plupart des cas,
// donc probablement déjà en place chez toi).

const ACCENT = COLORS.primary ?? '#E5533C';

// ─────────────────────────────────────────────
// Regroupement par jour (Aujourd'hui / Hier / Plus ancien)
// ─────────────────────────────────────────────
function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function groupNotificationsByDay(notifications: AppNotification[]) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const groups: { title: string; data: AppNotification[] }[] = [
    { title: "Aujourd'hui", data: [] },
    { title: 'Hier', data: [] },
    { title: 'Plus ancien', data: [] },
  ];

  notifications.forEach((n) => {
    const date = new Date(n.created_at);
    if (isSameDay(date, today)) {
      groups[0].data.push(n);
    } else if (isSameDay(date, yesterday)) {
      groups[1].data.push(n);
    } else {
      groups[2].data.push(n);
    }
  });

  // On ne garde que les sections qui ont du contenu
  return groups.filter((g) => g.data.length > 0);
}

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
// Icône selon le type de notification
// ─────────────────────────────────────────────
// ⚠️ Hypothèse sur les valeurs exactes de `notification.data.type` envoyées
// par le backend :
//  - "product_created" / "product" → nouveau produit publié (côté buyer)
//  - "order_placed" / "order"      → nouvelle commande (côté producteur,
//    confirmé — c'est la valeur utilisée dans OrderPlacedForProducer::toDatabase())
//  - "driver_assigned" / "delivery" / "transporter" → livraison/transporteur
//    assigné (côté buyer)
// Si tes vraies chaînes diffèrent, ajuste juste les valeurs dans ce switch,
// rien d'autre n'a besoin de changer.
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

// ─────────────────────────────────────────────
// Une ligne de notification, avec swipe-to-delete
// ─────────────────────────────────────────────
function NotificationRow({
  notification,
  selectionMode,
  isSelected,
  onPress,
  onLongPress,
  onDelete,
}: {
  notification: AppNotification;
  selectionMode: boolean;
  isSelected: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onDelete: () => void;
}) {
  const swipeableRef = useRef<Swipeable>(null);
  const isUnread = notification.read_at === null;
  const iconName = getIconForNotificationType(notification.data.type);

  const renderRightActions = () => (
    <TouchableOpacity
      style={styles.deleteAction}
      onPress={() => {
        swipeableRef.current?.close();
        onDelete();
      }}
      activeOpacity={0.8}
    >
      <Ionicons name="trash-outline" size={20} color="#fff" />
      <Text style={styles.deleteActionText}>Supprimer</Text>
    </TouchableOpacity>
  );

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      // En mode sélection, on désactive le swipe pour ne pas entrer en
      // conflit avec le tap-to-select.
      enabled={!selectionMode}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={350}
        style={[styles.row, isUnread && styles.rowUnread]}
      >
        {selectionMode && (
          <Ionicons
            name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
            size={22}
            color={isSelected ? ACCENT : COLORS.textSecondary}
            style={styles.checkbox}
          />
        )}

        <View style={styles.rowIcon}>
          <Ionicons name={iconName} size={18} color={ACCENT} />
        </View>

        <View style={styles.rowBody}>
          <Text style={styles.rowTitle} numberOfLines={2}>
            {notification.data.title}
          </Text>
          <Text style={styles.rowMessage} numberOfLines={2}>
            {notification.data.message}
          </Text>
          <Text style={styles.rowTime}>{timeAgo(notification.created_at)}</Text>
        </View>

        {!selectionMode && isUnread && <View style={styles.dot} />}
      </TouchableOpacity>
    </Swipeable>
  );
}

// ─────────────────────────────────────────────
// Écran principal
// ─────────────────────────────────────────────
export default function NotificationListScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<any>();

  const notifications = useSelector(selectNotifications);
  const isLoading = useSelector(selectNotificationsLoading);
  const hasMore = useSelector(selectNotificationsHasMore);
  const currentPage = useSelector(selectNotificationsCurrentPage);
  const unreadCount = useSelector(selectNotificationsUnreadCount);
  const selectionMode = useSelector(selectSelectionMode);
  const selectedIds = useSelector(selectSelectedIds);
  const isDeleting = useSelector(selectIsDeleting);

  const sections = useMemo(() => groupNotificationsByDay(notifications), [notifications]);
  const allSelected = selectedIds.length > 0 && selectedIds.length === notifications.length;

  const loadFirstPage = useCallback(() => {
    dispatch(fetchNotifications(1));
  }, [dispatch]);

  React.useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      dispatch(fetchNotifications(currentPage + 1));
    }
  }, [dispatch, isLoading, hasMore, currentPage]);

  const handlePressRow = useCallback(
    (notification: AppNotification) => {
      if (selectionMode) {
        dispatch(toggleSelectNotification(notification.id));
        return;
      }
      dispatch(fetchNotificationDetail(notification.id));
      navigation.navigate('NotificationDetail', { id: notification.id });
    },
    [dispatch, navigation, selectionMode]
  );

  const handleLongPressRow = useCallback(
    (notification: AppNotification) => {
      if (!selectionMode) {
        dispatch(enterSelectionMode(notification.id));
      }
    },
    [dispatch, selectionMode]
  );

  const confirmAndDelete = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      Alert.alert(
        ids.length > 1 ? `Supprimer ${ids.length} notifications ?` : 'Supprimer cette notification ?',
        'Cette action est définitive.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: () => dispatch(deleteNotifications(ids)),
          },
        ]
      );
    },
    [dispatch]
  );

  const handleDeleteSingle = useCallback(
    (id: string) => confirmAndDelete([id]),
    [confirmAndDelete]
  );

  const handleDeleteSelected = useCallback(
    () => confirmAndDelete(selectedIds),
    [confirmAndDelete, selectedIds]
  );

  const handleToggleSelectAll = useCallback(() => {
    if (allSelected) {
      dispatch(deselectAllNotifications());
    } else {
      dispatch(selectAllNotifications());
    }
  }, [dispatch, allSelected]);

  const handleCancelSelection = useCallback(() => {
    dispatch(exitSelectionMode());
  }, [dispatch]);

  const handleEnterSelectionFromHeader = useCallback(() => {
    dispatch(enterSelectionMode());
  }, [dispatch]);

  // ✅ Marque la sélection actuelle comme lue. Il n'existe pas d'endpoint
  // "marquer plusieurs comme lues en une fois" côté backend pour l'instant,
  // donc on déclenche un markNotificationAsRead par id non-lu sélectionné.
  // Le reducer se charge déjà de décrémenter unreadCount pour chacun.
  const handleMarkSelectedAsRead = useCallback(() => {
    const idsToMark = notifications
      .filter((n) => selectedIds.includes(n.id) && n.read_at === null)
      .map((n) => n.id);

    if (idsToMark.length === 0) return;

    idsToMark.forEach((id) => {
      dispatch(markNotificationAsRead(id));
    });
  }, [dispatch, notifications, selectedIds]);

  // ✅ "Tout marquer comme lu" — utilise l'endpoint dédié /read-all,
  // disponible en mode normal (hors sélection).
  const handleMarkAllAsRead = useCallback(() => {
    if (unreadCount === 0) return;
    dispatch(markAllNotificationsAsRead());
  }, [dispatch, unreadCount]);

  return (
    <View style={styles.container}>
      {/* ── Header ─────────────────────────────────── */}
      {selectionMode ? (
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancelSelection} hitSlop={styles.hitSlop}>
            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            {selectedIds.length} sélectionnée{selectedIds.length > 1 ? 's' : ''}
          </Text>

          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleToggleSelectAll} hitSlop={styles.hitSlop}>
              <Ionicons
                name={allSelected ? 'checkmark-done' : 'checkmark-done-outline'}
                size={22}
                color={COLORS.textPrimary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleMarkSelectedAsRead}
              disabled={selectedIds.length === 0}
              hitSlop={styles.hitSlop}
            >
              <Ionicons
                name="mail-open-outline"
                size={22}
                color={selectedIds.length === 0 ? COLORS.textSecondary : COLORS.textPrimary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDeleteSelected}
              disabled={selectedIds.length === 0 || isDeleting}
              hitSlop={styles.hitSlop}
              style={styles.deleteHeaderButton}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color={COLORS.danger} />
              ) : (
                <Ionicons
                  name="trash-outline"
                  size={22}
                  color={selectedIds.length === 0 ? COLORS.textSecondary : COLORS.danger}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={styles.hitSlop}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Notification</Text>

          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              hitSlop={styles.hitSlop}
            >
              <Ionicons
                name="mail-open-outline"
                size={22}
                color={unreadCount === 0 ? COLORS.textSecondary : COLORS.textPrimary}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleEnterSelectionFromHeader} hitSlop={styles.hitSlop}>
              <Ionicons name="checkmark-circle-outline" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Liste ──────────────────────────────────── */}
      {isLoading && notifications.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      ) : notifications.length === 0 ? (
        <EmptyState message="Aucune notification pour le moment." />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionTitle}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <NotificationRow
              notification={item}
              selectionMode={selectionMode}
              isSelected={selectedIds.includes(item.id)}
              onPress={() => handlePressRow(item)}
              onLongPress={() => handleLongPressRow(item)}
              onDelete={() => handleDeleteSingle(item.id)}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
          onEndReachedThreshold={0.4}
          onEndReached={handleLoadMore}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={loadFirstPage} tintColor={ACCENT} />
          }
          ListFooterComponent={
            isLoading && notifications.length > 0 ? (
              <ActivityIndicator style={styles.footerLoader} size="small" color={ACCENT} />
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  deleteHeaderButton: {
    minWidth: 22,
    alignItems: 'center',
  },
  hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
  listContent: {
    paddingBottom: SPACING.xl ?? 32,
  },
  sectionTitle: {
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.bold,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  rowUnread: {
    backgroundColor: COLORS.surface ?? '#FAFAFA',
  },
  checkbox: {
    marginRight: SPACING.sm,
    marginTop: 4,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
    backgroundColor: COLORS.surface ?? '#F3F3F3',
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
    color: COLORS.textPrimary,
  },
  rowMessage: {
    fontSize: FONT.size.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  rowTime: {
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
    backgroundColor: ACCENT,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border ?? '#E5E5E5',
    marginLeft: SPACING.md + 36 + SPACING.sm,
  },
  deleteAction: {
    backgroundColor: COLORS.danger ?? '#E5533C',
    justifyContent: 'center',
    alignItems: 'center',
    width: 84,
  },
  deleteActionText: {
    color: '#fff',
    fontSize: 11,
    marginTop: 4,
    fontWeight: FONT.weight.semibold,
  },
  footerLoader: {
    marginVertical: SPACING.md,
  },
});