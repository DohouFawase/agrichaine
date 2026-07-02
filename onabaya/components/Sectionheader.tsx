import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT, SPACING } from '@/hooks/theme';


interface SectionHeaderProps {
  title: string;
  count?: number;
  accentColor?: string;
}

export default function SectionHeader({ title, count, accentColor }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {typeof count === 'number' && (
        <View style={[styles.countPill, accentColor ? { backgroundColor: accentColor } : null]}>
          <Text style={styles.countText}>{count}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.bold,
    color: COLORS.textPrimary,
  },
  countPill: {
    marginLeft: SPACING.sm,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.textMuted,
  },
  countText: {
    color: '#FFFFFF',
    fontSize: FONT.size.xs,
    fontWeight: FONT.weight.bold,
  },
});