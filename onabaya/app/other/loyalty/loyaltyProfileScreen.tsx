import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { AppDispatch, RootState } from '@/stores';
import { COLORS, FONT, RADIUS, SPACING } from '@/hooks/theme';
import EmptyState from '@/components/Emptystate';
import { fetchLoyaltyStatuses, LoyaltyStatus } from '@/providers/loyalyty/loyaltyprovideraction';


const ACCENT = COLORS.primary ?? '#E5533C';
const GOLD = '#B8860B';
const GOLD_BG = '#FEF3C7';

// ─────────────────────────────────────────────
// Icône selon le palier atteint
// ⚠️ Hypothèse sur les badge_slug définis par LoyaltyTierSeeder :
// 'montant_client', 'loyal_client', 'top_client'.
// ─────────────────────────────────────────────
function getTierIcon(badgeSlug: string): keyof typeof Ionicons.glyphMap {
  switch (badgeSlug) {
    case 'top_client':
      return 'trophy';
    case 'loyal_client':
      return 'ribbon';
    case 'montant_client':
    default:
      return 'star';
  }
}

function formatPrice(amount: number) {
  return `${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} F`;
}

// ─────────────────────────────────────────────
// Carte d'un statut de fidélité (un producteur)
// ─────────────────────────────────────────────
function LoyaltyStatusCard({
  status,
  highlighted,
  onProgramSchedule,
}: {
  status: LoyaltyStatus;
  highlighted: boolean;
  onProgramSchedule: () => void;
}) {
  const isTopTier = status.badge_slug === 'top_client';
  const icon = getTierIcon(status.badge_slug);

  const progressPercent = status.next_tier
    ? Math.max(
        0,
        Math.min(
          100,
          100 -
            Math.max(
              (status.next_tier.volume_remaining /
                Math.max(status.rolling_volume + status.next_tier.volume_remaining, 1)) *
                100,
              (status.next_tier.orders_remaining /
                Math.max(status.rolling_orders_count + status.next_tier.orders_remaining, 1)) *
                100
            )
        )
      )
    : 100;

  return (
    <View style={[styles.card, highlighted && styles.cardHighlighted]}>
      <View style={styles.cardHeader}>
        <View style={[styles.badgeIcon, isTopTier && styles.badgeIconGold]}>
          <Ionicons name={icon} size={22} color={isTopTier ? GOLD : ACCENT} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.producerName}>{status.producer_name}</Text>
          <Text style={[styles.tierName, isTopTier && styles.tierNameGold]}>
            {status.tier_name}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <Text style={styles.statsText}>
          {formatPrice(status.rolling_volume)} · {status.rolling_orders_count} commande
          {status.rolling_orders_count > 1 ? 's' : ''} (2 derniers mois)
        </Text>
      </View>

      {status.next_tier ? (
        <View style={styles.progressSection}>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.progressLabel}>
            Encore {formatPrice(status.next_tier.volume_remaining)} ou{' '}
            {status.next_tier.orders_remaining} commande
            {status.next_tier.orders_remaining > 1 ? 's' : ''} pour devenir{' '}
            <Text style={{ fontWeight: '700' }}>{status.next_tier.name}</Text>
          </Text>
        </View>
      ) : (
        <View style={styles.maxTierBadge}>
          <Ionicons name="checkmark-circle" size={14} color={GOLD} />
          <Text style={styles.maxTierText}>Palier maximum atteint</Text>
        </View>
      )}

      {status.can_enable_recurring_purchases && (
        <TouchableOpacity style={styles.programBtn} onPress={onProgramSchedule}>
          <Ionicons name="calendar-outline" size={16} color="#FFF" />
          <Text style={styles.programBtnText}>
            {status.recurring_purchases_enabled
              ? 'Gérer mes achats programmés'
              : 'Activer la programmation d\'achats'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────
// Écran principal
// ─────────────────────────────────────────────
export default function LoyaltyProfileScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  // Si l'écran est ouvert depuis le tap sur la notif "Meilleur Client",
  // ce param permet de mettre en avant la bonne carte producteur.
  const highlightedProducerId: string | undefined = route.params?.producerId;
  const scrollRef = useRef<ScrollView>(null);

  const { statuses, isLoadingStatuses, statusesError } = useSelector(
    (state: RootState) => state.loyalty
  );

  const loadStatuses = useCallback(() => {
    dispatch(fetchLoyaltyStatuses());
  }, [dispatch]);

  useEffect(() => {
    loadStatuses();
  }, [loadStatuses]);

  const handleProgramSchedule = useCallback(
    (producerId: string) => {
      // 🎯 Écran à construire ensuite : liste + création de commandes
      // programmées, filtrée sur ce producteur.
      navigation.navigate('RecurringOrders', { producerId });
    },
    [navigation]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ma fidélité</Text>
        <View style={{ width: 22 }} />
      </View>

      {isLoadingStatuses && statuses.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      ) : statusesError ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{statusesError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadStatuses}>
            <Text style={styles.retryBtnText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : statuses.length === 0 ? (
        <EmptyState message="Continuez vos achats pour débloquer vos premiers badges de fidélité !" />
      ) : (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={isLoadingStatuses} onRefresh={loadStatuses} tintColor={ACCENT} />
          }
        >
          <Text style={styles.introText}>
            Votre fidélité est calculée par vendeur, sur vos 2 derniers mois d&apos;achats.
          </Text>

          {statuses.map((status) => (
            <LoyaltyStatusCard
              key={status.producer_id}
              status={status}
              highlighted={status.producer_id === highlightedProducerId}
              onProgramSchedule={() => handleProgramSchedule(status.producer_id)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingTop: 44,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border ?? '#E5E5E5',
  },
  headerTitle: {
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.bold,
    color: COLORS.textPrimary,
  },
  scrollContent: { padding: SPACING.md, paddingBottom: 40 },
  introText: {
    fontSize: FONT.size.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 18,
  },
  errorText: { color: COLORS.danger ?? '#E5533C', textAlign: 'center', marginBottom: 12 },
  retryBtn: { backgroundColor: ACCENT, paddingHorizontal: 20, paddingVertical: 10, borderRadius: RADIUS.md ?? 10 },
  retryBtnText: { color: '#FFF', fontWeight: '600' },

  card: {
    backgroundColor: '#FFF',
    borderRadius: RADIUS.lg ?? 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    elevation: 1,
  },
  cardHighlighted: {
    borderColor: GOLD,
    backgroundColor: GOLD_BG,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  badgeIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full ?? 22,
    backgroundColor: COLORS.surface ?? '#F3F3F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeIconGold: { backgroundColor: GOLD_BG },
  producerName: { fontSize: FONT.size.sm, fontWeight: '700', color: COLORS.textPrimary },
  tierName: { fontSize: FONT.size.xs, color: ACCENT, fontWeight: '600', marginTop: 1 },
  tierNameGold: { color: GOLD },

  statsRow: { marginBottom: SPACING.sm },
  statsText: { fontSize: 12, color: COLORS.textSecondary },

  progressSection: { marginBottom: SPACING.sm },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.surface ?? '#EEE',
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: { height: '100%', backgroundColor: ACCENT, borderRadius: 3 },
  progressLabel: { fontSize: 11, color: COLORS.textSecondary, lineHeight: 15 },

  maxTierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.sm,
  },
  maxTierText: { fontSize: 12, color: GOLD, fontWeight: '600' },

  programBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: ACCENT,
    borderRadius: RADIUS.md ?? 12,
    paddingVertical: 12,
    marginTop: 4,
  },
  programBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
});