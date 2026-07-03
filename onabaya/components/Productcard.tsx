import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
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
  const producer = product.producer;
  const rating = producer?.rating ?? product.rating;
  const reviewCount = producer?.review_count ?? product.review_count;
  const distanceText = product.distance_text;
  const isTopRated = producer?.is_top_rated ?? product.is_top_rated;
  const isVerified = producer?.is_verified ?? product.is_verified;
  const imageUrl = product.image_url ?? producer?.image_url;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onPress?.(product)}
      style={styles.card}
    >
      {/* Image / fallback */}
      <View style={styles.imageWrapper}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.imageFallback, { backgroundColor: accentColor + '1A' }]}>
            <Text style={[styles.iconLetter, { color: accentColor }]}>
              {product.name?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        {/* Nom + badge vérifié */}
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
          {isVerified && (
            <View style={[styles.verifiedBadge, { backgroundColor: accentColor }]}>
              <Text style={styles.verifiedCheck}>✓</Text>
            </View>
          )}
        </View>

        {/* Note + avis */}
        {rating != null && (
          <View style={styles.ratingRow}>
            <Text style={styles.star}>★</Text>
            <Text style={styles.ratingValue}>{rating}</Text>
            {reviewCount != null && (
              <Text style={styles.reviewCount}>({formatAmount(reviewCount)})</Text>
            )}
          </View>
        )}

        {/* Distance / temps */}
        {distanceText ? (
          <Text style={styles.meta} numberOfLines={1}>{distanceText}</Text>
        ) : (
          <Text style={styles.meta} numberOfLines={1}>
            {product.quantity} {product.unit} · {product.location}
          </Text>
        )}

        {showProducer && producer && (
          <Text style={styles.producer} numberOfLines={1}>
            {producer.name} {producer.last_name}
          </Text>
        )}

        {/* Bandeau Top Rated */}
        {isTopRated && (
          <View style={[styles.topRatedPill, { borderColor: accentColor }]}>
            <Text style={[styles.topRatedText, { color: accentColor }]}>🏆 Top Rated Vendor</Text>
          </View>
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
   width: 180, // ← ajouté pour le mode carrousel
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    marginRight: SPACING.sm, // ← remplace marginHorizontal
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  imageWrapper: {
    width: '100%',
    height: 110,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLetter: {
    fontSize: FONT.size.lg,
    fontWeight: FONT.weight.bold,
  },
  info: {
    padding: SPACING.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  verifiedBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  verifiedCheck: {
    fontSize: 9,
    color: COLORS.background,
    fontWeight: FONT.weight.bold,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  star: {
    fontSize: FONT.size.xs,
    color: '#F5A623',
    marginRight: 2,
  },
  ratingValue: {
    fontSize: FONT.size.xs,
    fontWeight: FONT.weight.semibold,
    color: COLORS.textPrimary,
    marginRight: 4,
  },
  reviewCount: {
    fontSize: FONT.size.xs,
    color: COLORS.textSecondary,
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
  topRatedPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: SPACING.xs ?? 4,
  },
  topRatedText: {
    fontSize: 10,
    fontWeight: FONT.weight.semibold,
  },
  price: {
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.bold,
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
  },
});