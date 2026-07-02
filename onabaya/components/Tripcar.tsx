import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONT, RADIUS, SPACING } from '@/hooks/theme';
import type { TripResource } from '@/types/home/homeType';

interface TripCardProps {
  trip: TripResource;
  accentColor: string;
  onPress?: (trip: TripResource) => void;
}

export default function TripCard({ trip, accentColor, onPress }: TripCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress?.(trip)}
      style={styles.card}
    >
      <View style={styles.routeRow}>
        <Text style={styles.city} numberOfLines={1}>{trip.departure_city}</Text>
        <Text style={[styles.arrow, { color: accentColor }]}>→</Text>
        <Text style={styles.city} numberOfLines={1}>{trip.destination_city}</Text>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.meta}>
          {trip.available_weight} kg dispo · {new Date(trip.departure_date).toLocaleDateString('fr-FR')}
        </Text>
        <View style={[styles.statusPill, { backgroundColor: accentColor + '1A' }]}>
          <Text style={[styles.statusText, { color: accentColor }]}>{trip.status}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  city: {
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  arrow: {
    marginHorizontal: SPACING.sm,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.bold,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  meta: {
    fontSize: FONT.size.xs,
    color: COLORS.textMuted,
  },
  statusPill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  statusText: {
    fontSize: FONT.size.xs,
    fontWeight: FONT.weight.semibold,
    textTransform: 'capitalize',
  },
});