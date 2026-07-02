import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT, RADIUS, SPACING } from '@/hooks/theme';
import type { TransactionItem } from '@/types/home/homeType';

interface WalletCardProps {
  balance: number;
  currency: string;
  accentColor: string;
  recentTransactions?: TransactionItem[];
  extra?: React.ReactNode; // ex: bloc escrow pour le buyer
}

function formatAmount(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value);
}

export default function WalletCard({
  balance,
  currency,
  accentColor,
  recentTransactions = [],
  extra,
}: WalletCardProps) {
  return (
    <View style={[styles.card, { borderColor: accentColor + '33' }]}>
      <Text style={styles.label}>Solde disponible</Text>
      <Text style={[styles.balance, { color: accentColor }]}>
        {formatAmount(balance)} <Text style={styles.currency}>{currency}</Text>
      </Text>

      {extra}

      {recentTransactions.length > 0 && (
        <View style={styles.transactionsBlock}>
          <Text style={styles.transactionsTitle}>Transactions récentes</Text>
          {recentTransactions.slice(0, 3).map((t) => (
            <View key={t.id} style={styles.transactionRow}>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionTitle} numberOfLines={1}>{t.title}</Text>
                <Text style={styles.transactionDate}>{t.reference}</Text>
              </View>
              <Text
                style={[
                  styles.transactionAmount,
                  { color: t.display_type === 'credit' ? COLORS.success : COLORS.danger },
                ]}
              >
                {t.display_type === 'credit' ? '+' : '-'}{formatAmount(t.amount)}
              </Text>
            </View>
          ))}
        </View>
      )}
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
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  label: {
    fontSize: FONT.size.sm,
    color: COLORS.textSecondary,
  },
  balance: {
    fontSize: FONT.size.xl,
    fontWeight: FONT.weight.bold,
    marginTop: 4,
  },
  currency: {
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.medium,
  },
  transactionsBlock: {
    marginTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },
  transactionsTitle: {
    fontSize: FONT.size.xs,
    fontWeight: FONT.weight.semibold,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  transactionInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  transactionTitle: {
    fontSize: FONT.size.sm,
    color: COLORS.textPrimary,
    fontWeight: FONT.weight.medium,
  },
  transactionDate: {
    fontSize: FONT.size.xs,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  transactionAmount: {
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
  },
});