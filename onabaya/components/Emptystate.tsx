import { COLORS, FONT, SPACING } from '@/hooks/theme';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface EmptyStateProps {
  message: string;
}

export default function EmptyState({ message }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  text: {
    fontSize: FONT.size.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});