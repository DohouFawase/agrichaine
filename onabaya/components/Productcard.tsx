import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONT, RADIUS, SPACING } from '@/hooks/theme';
import type { ProductResource } from '@/types/home/homeType';

interface ProductCardProps {
  product: ProductResource;
  accentColor: string;
  showProducer?: boolean;
  onPress?: (product: ProductResource) => void;
}

function formatAmount(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value);
}

export default function ProductCard({ product, accentColor, showProducer, onPress }: ProductCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress?.(product)}
      style={styles.card}
    >
      <View style={[styles.iconBlock, { backgroundColor: accentColor + '1A' }]}>
        <Text style={[styles.iconLetter, { color: accentColor }]}>
          {product.name?.[0]?.toUpperCase() ?? '?'}
        </Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {product.quantity} {product.unit} · {product.location}
        </Text>
        {showProducer && product.producer && (
          <Text style={styles.producer} numberOfLines={1}>
            {product.producer.name} {product.producer.last_name}
          </Text>
        )}
      </View>

      <Text style={[styles.price, { color: accentColor }]}>
        {formatAmount(product.price_per_unit)} FCFA
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  iconBlock: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  iconLetter: {
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.bold,
  },
  info: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  name: {
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
    color: COLORS.textPrimary,
  },
  meta: {
    fontSize: FONT.size.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  producer: {
    fontSize: FONT.size.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  price: {
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.bold,
  },
});