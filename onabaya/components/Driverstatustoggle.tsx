import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONT, RADIUS, SPACING } from '@/hooks/theme';
import type { DriverStatusPayload } from '@/types/home/homeType';

interface DriverStatusToggleProps {
  driverStatus: DriverStatusPayload;
  accentColor: string;
  onChange?: (status: DriverStatusPayload['status']) => void;
}

const OPTIONS: { value: DriverStatusPayload['status']; label: string; color: string }[] = [
  { value: 'available', label: 'Disponible', color: COLORS.success },
  { value: 'busy', label: 'Occupé', color: COLORS.warning },
  { value: 'offline', label: 'Hors ligne', color: COLORS.textMuted },
];

export default function DriverStatusToggle({ driverStatus, accentColor, onChange }: DriverStatusToggleProps) {
  return (
    <View style={[styles.card, { borderColor: accentColor + '33' }]}>
      <Text style={styles.label}>Statut chauffeur</Text>
      <View style={styles.optionsRow}>
        {OPTIONS.map((opt) => {
          const active = driverStatus.status === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              activeOpacity={0.7}
              onPress={() => onChange?.(opt.value)}
              style={[
                styles.option,
                active && { backgroundColor: opt.color + '1A', borderColor: opt.color },
              ]}
            >
              <View style={[styles.dot, { backgroundColor: opt.color }]} />
              <Text style={[styles.optionText, active && { color: opt.color, fontWeight: FONT.weight.semibold }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
  },
  label: {
    fontSize: FONT.size.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 3,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  optionText: {
    fontSize: FONT.size.xs,
    color: COLORS.textSecondary,
  },
});