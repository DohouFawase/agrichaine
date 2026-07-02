import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT, SPACING } from '@/hooks/theme';
import type { EscrowPayload } from '@/types/home/homeType';

interface EscrowBlockProps {
  escrow: EscrowPayload;
  accentColor: string;
}

function formatAmount(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value);
}

export default function EscrowBlock({ escrow, accentColor }: EscrowBlockProps) {
  if (escrow.active_orders.length === 0) return null;

  return (
    <View style={[styles.container, { backgroundColor: accentColor + '0D' }]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Fonds en séquestre</Text>
        <Text style={[styles.amount, { color: accentColor }]}>
          {formatAmount(escrow.total_amount)} FCFA
        </Text>
      </View>
      {escrow.active_orders.map((item) => (
        <View key={item.order_id} style={styles.row}>
          <Text style={styles.productName} numberOfLines={1}>{item.product_name}</Text>
          <Text style={styles.statusLabel}>{item.status_label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.md,
    borderRadius: 10,
    padding: SPACING.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: FONT.size.xs,
    fontWeight: FONT.weight.semibold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  amount: {
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.bold,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  productName: {
    flex: 1,
    fontSize: FONT.size.xs,
    color: COLORS.textPrimary,
    marginRight: SPACING.sm,
  },
  statusLabel: {
    fontSize: FONT.size.xs,
    color: COLORS.textMuted,
  },
});