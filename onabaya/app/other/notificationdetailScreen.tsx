import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import type { AppDispatch } from '@/stores';
import { COLORS, FONT, RADIUS, SPACING } from '@/hooks/theme';
import {
  fetchNotificationDetail,
} from '@/providers/notification/notificationsProvideraction';
import {
  selectSelectedNotification,
  selectNotificationDetailLoading,
} from '@/slice/notificationSlice';

// import {
//   subscribeToProducer,
//   unsubscribeFromProducer,
// } from '@/providers/producer/producerProviderAction';
// import {
//   addProductToFavorites,
//   removeProductFromFavorites,
// } from '@/providers/favorite/favoriteProviderAction';

const ACCENT = COLORS.primary ?? '#E5533C';

// ─────────────────────────────────────────────
// Catégorie de notification — pilote quelles sections/boutons s'affichent.
// Même mapping que dans NotificationListScreen / NotificationsDropdown,
// ajuste les valeurs si tes vraies chaînes `data.type` diffèrent.
// ─────────────────────────────────────────────
type NotificationCategory = 'product' | 'order' | 'delivery';

function getNotificationCategory(type: string | undefined): NotificationCategory {
  switch (type) {
    case 'order_placed':
    case 'order':
      return 'order';
    case 'driver_assigned':
    case 'delivery':
    case 'transporter':
      return 'delivery';
    case 'product_created':
    case 'product':
    default:
      return 'product';
  }
}

function getCategoryIcon(category: NotificationCategory): keyof typeof Ionicons.glyphMap {
  switch (category) {
    case 'order':
      return 'cart-outline';
    case 'delivery':
      return 'car-outline';
    case 'product':
    default:
      return 'cube-outline';
  }
}

function formatPrice(value: number | undefined | null): string {
  if (value === undefined || value === null) return 'Prix non spécifié';
  if (value === 0) return 'Gratuit';
  return `${value.toLocaleString('fr-FR')} FCFA`;
}

function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return 'Date inconnue';
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export default function NotificationDetailScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const router = useRouter();
  const { id } = route.params ?? {};

  const notification = useSelector(selectSelectedNotification);
  const isLoading = useSelector(selectNotificationDetailLoading);

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isFavoriting, setIsFavoriting] = useState(false);

  useEffect(() => {
    if (id && notification?.id !== id) {
      dispatch(fetchNotificationDetail(id));
    }
  }, [dispatch, id, notification?.id]);

  //   const handleToggleSubscribe = useCallback(async () => { ... }, [...]);
  //   const handleToggleFavorite = useCallback(async () => { ... }, [...]);

  if (isLoading && !notification) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  if (!notification) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Notification introuvable.</Text>
      </View>
    );
  }

  const { data } = notification;
  const category = getNotificationCategory(data.type);
  const categoryIcon = getCategoryIcon(category);

  return (
    <View style={styles.container}>
      {/* ── Header ─────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={styles.hitSlop}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détail</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── Visuel — photo produit si dispo (surtout catégorie "product"),
            sinon un gros médaillon avec l'icône de la catégorie ────── */}
        {data.stock_proof_photo_path ? (
          <Image source={{ uri: data.stock_proof_photo_path }} style={styles.productImage} />
        ) : (
          <View style={[styles.productImage, styles.productImagePlaceholder]}>
            <Ionicons name={categoryIcon} size={48} color={COLORS.textSecondary} />
          </View>
        )}

        {/* ── Titre & message de la notif — toujours affichés ──────── */}
        <View style={styles.section}>
          <Text style={styles.title}>{data.title}</Text>
          <Text style={styles.message}>{data.message}</Text>
        </View>

        {/* ══════════════════ CATÉGORIE : PRODUIT ══════════════════ */}
        {category === 'product' && (
          <>
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.7}
              onPress={() => {
                const targetProductId = data.product_id;
                if (targetProductId) {
                  router.push({
                    pathname: '/other/producer/productdetailScreen',
                    params: { id: targetProductId },
                  });
                }
              }}
            >
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Prix</Text>
                <Text style={styles.infoValuePrice}>{formatPrice(data.price_per_unit ?? data.price)}</Text>
              </View>
              <View style={styles.separator} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Quantité disponible</Text>
                <Text style={styles.infoValue}>{data.quantity ?? 'Non renseignée'}</Text>
              </View>
              <View style={styles.separator} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Publié le</Text>
                <Text style={styles.infoValue}>{formatDate(data.product_created_at)}</Text>
              </View>

              <View style={styles.viewMoreRow}>
                <Text style={styles.viewMoreText}>Voir les détails du produit</Text>
                <Ionicons name="chevron-forward" size={14} color={ACCENT} />
              </View>
            </TouchableOpacity>

            <View style={styles.card}>
              <View style={styles.producerRow}>
                <View style={styles.producerAvatar}>
                  <Ionicons name="person" size={20} color={ACCENT} />
                </View>
                <View style={styles.producerBody}>
                  <Text style={styles.producerLabel}>Producteur</Text>
                  <Text style={styles.producerName}>{data.producer?.name ?? 'Inconnu'}</Text>
                </View>
              </View>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionButton, isSubscribed && styles.actionButtonActive]}
                disabled={isSubscribing}
                activeOpacity={0.8}
              >
                {isSubscribing ? (
                  <ActivityIndicator size="small" color={isSubscribed ? '#fff' : ACCENT} />
                ) : (
                  <>
                    <Ionicons
                      name={isSubscribed ? 'checkmark-circle' : 'person-add-outline'}
                      size={18}
                      color={isSubscribed ? '#fff' : ACCENT}
                    />
                    <Text
                      style={[
                        styles.actionButtonText,
                        isSubscribed && styles.actionButtonTextActive,
                      ]}
                    >
                      {isSubscribed ? 'Abonné' : 'S’abonner'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.favoriteButton]}
                disabled={isFavoriting}
                activeOpacity={0.8}
              >
                {isFavoriting ? (
                  <ActivityIndicator size="small" color={ACCENT} />
                ) : (
                  <>
                    <Ionicons
                      name={isFavorite ? 'heart' : 'heart-outline'}
                      size={18}
                      color={isFavorite ? ACCENT : COLORS.textPrimary}
                    />
                    <Text style={styles.actionButtonText}>
                      {isFavorite ? 'Dans mes favoris' : 'Ajouter aux favoris'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ══════════════════ CATÉGORIE : COMMANDE ═════════════════
            ⚠️ Champs basés sur OrderPlacedForProducer::toDatabase() —
            order_id, product_id, quantity (= quantité commandée),
            price (= montant total). Pas de nom d'acheteur persisté pour
            l'instant : si tu ajoutes 'buyer_name' côté backend, ajoute
            juste la ligne correspondante ci-dessous.                */}
        {category === 'order' && (
          <>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Quantité commandée</Text>
                <Text style={styles.infoValue}>{data.quantity ?? 'Non renseignée'}</Text>
              </View>
              <View style={styles.separator} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Montant total</Text>
                <Text style={styles.infoValuePrice}>{formatPrice(data.price)}</Text>
              </View>
              <View style={styles.separator} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Commande reçue le</Text>
                <Text style={styles.infoValue}>{formatDate(notification.created_at)}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.actionButton, styles.fullWidthButton]}
              activeOpacity={0.8}
              // onPress={() => {
              //   if (data.order_id) {
              //     // ⚠️ Route supposée — adapte au vrai nom de ton écran
              //     // de détail de commande si différent.
              //     router.push({
              //       pathname: '/other/orderdetailScreen',
              //       params: { id: data.order_id },
              //     });
              //   }
              // }}
            >
              <Ionicons name="receipt-outline" size={18} color={ACCENT} />
              <Text style={styles.actionButtonText}>Voir la commande</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ══════════════════ CATÉGORIE : LIVRAISON ════════════════
            ⚠️ Aucun champ backend confirmé pour ce cas — placeholders à
            adapter dès que tu me donnes la vraie forme des données
            (nom du transporteur, statut, zone, etc.).                */}
        {category === 'delivery' && (
          <>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Statut</Text>
                <Text style={styles.infoValue}>{data.status ?? 'Livraison en cours'}</Text>
              </View>
              <View style={styles.separator} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Mis à jour le</Text>
                <Text style={styles.infoValue}>{formatDate(notification.created_at)}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.actionButton, styles.fullWidthButton]}
              activeOpacity={0.8}
              // onPress={() => {
              //   if (data.order_id) {
              //     // ⚠️ Route supposée — adapte au vrai nom de ton écran
              //     // de suivi de livraison si différent.
              //     router.push({
              //       pathname: '/other/buyer/deliveryTrackingScreen',
              //       params: { id: data.order_id },
              //     });
              //   }
              // }}
            >
              <Ionicons name="navigate-outline" size={18} color={ACCENT} />
              <Text style={styles.actionButtonText}>Suivre la livraison</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingTop: 40,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border ?? '#E5E5E5',
  },
  headerTitle: {
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.bold,
    color: COLORS.textPrimary,
  },
  hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl ?? 32,
  },
  productImage: {
    width: '100%',
    height: 200,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
  },
  productImagePlaceholder: {
    backgroundColor: COLORS.surface ?? '#F3F3F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT.size.lg ?? 18,
    fontWeight: FONT.weight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  message: {
    fontSize: FONT.size.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  card: {
    backgroundColor: COLORS.surface ?? '#FAFAFA',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  infoLabel: {
    fontSize: FONT.size.sm,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
    color: COLORS.textPrimary,
  },
  infoValuePrice: {
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.bold,
    color: ACCENT,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border ?? '#E5E5E5',
    marginVertical: 4,
  },
  viewMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 4,
  },
  viewMoreText: {
    fontSize: 12,
    color: ACCENT,
    fontWeight: '600',
  },
  producerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  producerAvatar: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    marginRight: SPACING.sm,
  },
  producerBody: {
    flex: 1,
  },
  producerLabel: {
    fontSize: FONT.size.xs,
    color: COLORS.textSecondary,
  },
  producerName: {
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: ACCENT,
  },
  fullWidthButton: {
    marginBottom: SPACING.md,
  },
  actionButtonActive: {
    backgroundColor: ACCENT,
  },
  favoriteButton: {
    borderColor: COLORS.border ?? '#E5E5E5',
  },
  actionButtonText: {
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
    color: COLORS.textPrimary,
  },
  actionButtonTextActive: {
    color: '#fff',
  },
});