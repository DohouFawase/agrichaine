import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONT, RADIUS, SPACING } from '@/hooks/theme';
import type { OrderResource, OrderStatus } from '@/types/home/homeType';

interface OrderCardProps {
  order: OrderResource;
  accentColor: string;
  onPress?: (order: OrderResource) => void;
  /** Cache le bouton "Suivre ma commande" (utile pour des commandes déjà terminées) */
  hideTrackingButton?: boolean;
}

// Statuts pour lesquels le suivi a un sens (pas encore livré/annulé/en litige)
const TRACKABLE_STATUSES: OrderStatus[] = ['searching', 'assigned', 'collected'];

const STATUS_LABEL: Record<OrderStatus, string> = {
  searching: 'Recherche transporteur',
  assigned: 'Transporteur assigné',
  collected: 'Collecté',
  delivered: 'Livré',
  disputed: 'Litige',
  cancelled: 'Annulé',
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  searching: COLORS.warning,
  assigned: '#2F6FED',
  collected: '#2E9E5B',
  delivered: '#2E9E5B',
  disputed: COLORS.danger,
  cancelled: COLORS.textMuted,
};

function formatAmount(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value);
}

export default function OrderCard({ order, accentColor, onPress, hideTrackingButton }: OrderCardProps) {
  const router = useRouter();
  const statusColor = STATUS_COLOR[order.status] ?? COLORS.textMuted;
  const canTrack = !hideTrackingButton && TRACKABLE_STATUSES.includes(order.status);

  const handleTrackPress = (e: any) => {
    // Empêche le press du bouton de déclencher aussi le onPress de la carte
    e.stopPropagation?.();
    router.push(`/orders/${order.id}/tracking`);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress?.(order)}
      style={[styles.card, { borderLeftColor: accentColor }]}
    >
      <View style={styles.headerRow}>
        <Text style={styles.productName} numberOfLines={1}>
          {order.product?.name ?? 'Produit'}
        </Text>
        <View style={[styles.statusPill, { backgroundColor: statusColor + '1A' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {STATUS_LABEL[order.status] ?? order.status}
          </Text>
        </View>
      </View>

      <Text style={styles.quantity}>
        {order.quantity_ordered} {order.product?.unit ?? ''}
      </Text>

      <View style={styles.footerRow}>
        <Text style={styles.price}>{formatAmount(order.total_price)} FCFA</Text>
        <Text style={styles.date}>
          {new Date(order.created_at).toLocaleDateString('fr-FR')}
        </Text>
      </View>

      {canTrack && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleTrackPress}
          style={[styles.trackButton, { backgroundColor: accentColor }]}
        >
          <Text style={styles.trackButtonText}>Suivre ma commande</Text>
          <Text style={styles.trackButtonChevron}>›</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productName: {
    flex: 1,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.semibold,
    color: COLORS.textPrimary,
    marginRight: SPACING.sm,
  },
  statusPill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  statusText: {
    fontSize: FONT.size.xs,
    fontWeight: FONT.weight.semibold,
  },
  quantity: {
    fontSize: FONT.size.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  price: {
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.bold,
    color: COLORS.textPrimary,
  },
  date: {
    fontSize: FONT.size.xs,
    color: COLORS.textMuted,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
  },
  trackButtonText: {
    color: '#FFFFFF',
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
  },
  trackButtonChevron: {
    color: '#FFFFFF',
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.bold,
    marginLeft: 4,
  },
});