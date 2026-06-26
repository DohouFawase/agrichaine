import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { ArrowDownLeft, History } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { FetchWalletAction } from '@/providers/users/walletProviderAction';

export default function WalletScreen() {
  const dispatch = useAppDispatch();
  
  // 🎯 Récupération de l'état enrichi depuis Redux
  const { 
    balance, 
    currency, 
    escrow,               // Contient total_amount et active_orders
    recent_transactions,  // Tableau des transactions formatées par le backend
    isLoading, 
    error 
  } = useAppSelector((state) => state.wallet);

  const loadWalletData = useCallback(async () => {
    console.log('=== [WalletScreen] Chargement du résumé portefeuille ===');
    try {
      await dispatch(FetchWalletAction());
    } catch (err) {
      console.error('[WalletScreen] Erreur lors du dispatch:', err);
    }
  }, [dispatch]);

  useEffect(() => {
    loadWalletData();
  }, [loadWalletData]);

  // Formateur de devise pour l'espace des milliers (ex: 182 500 F)
  const formatCurrency = (amount: number | undefined | null, symbol: string) => {
    const safeAmount = amount ?? 0;
    const formattedAmount = safeAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    const displaySymbol = symbol === 'XOF' ? 'F' : symbol;
    return `${formattedAmount} ${displaySymbol}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1D9E75" />

      {/* --- HEADER VERT (SOLDE DISPONIBLE) --- */}
      <View style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>SOLDE DISPONIBLE</Text>
            
            {isLoading && balance === undefined ? (
              <ActivityIndicator color="#FFFFFF" size="large" style={styles.loader} />
            ) : (
              <Text style={styles.balanceText}>
                {formatCurrency(balance, currency)}
              </Text>
            )}

            {/* Actions boutons rapides de Wallet.png */}
            <View style={styles.actionRow}>
              <TouchableOpacity activeOpacity={0.8} style={styles.actionButton}>
                <ArrowDownLeft size={20} color="#1D9E75" strokeWidth={2.5} />
                <Text style={styles.actionButtonText}>Retirer</Text>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.8} style={styles.actionButton}>
                <History size={18} color="#1D9E75" strokeWidth={2.5} />
                <Text style={styles.actionButtonText}>Historiques</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* --- CORPS SCROLLABLE --- */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadWalletData} tintColor="#1D9E75" />
        }
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Détail de l'erreur : {error}</Text>
          </View>
        )}

        {/* --- SECTION : EN SÉQUESTRE --- */}
        {escrow?.active_orders && escrow.active_orders.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>En séquestre ({formatCurrency(escrow.total_amount, currency)})</Text>
            
            {escrow.active_orders.map((order: any) => (
              <View key={order.order_id} style={styles.sequestreCard}>
                {/* Le grand rectangle vert clair de Wallet.png */}
                <View style={styles.sequestreIllustration} />
                <View style={styles.sequestreDetails}>
                  <View style={styles.sequestreRow}>
                    <Text style={styles.sequestreProduct}>
                      {order.product_name} · {order.quantity} {order.unit}
                    </Text>
                    <Text style={styles.sequestreStatus}>{order.status_label}</Text>
                  </View>
                  <Text style={styles.sequestrePrice}>
                    {formatCurrency(order.display_amount, currency)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : !isLoading ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>En séquestre</Text>
            <Text style={styles.emptyText}>Aucun fonds bloqué au séquestre pour le moment.</Text>
          </View>
        ) : null}

        {/* --- SECTION : TRANSACTIONS RÉCENTES --- */}
        <View style={[styles.section, styles.transactionsSection]}>
          <Text style={styles.sectionTitle}>Transactions récentes</Text>
          
          {isLoading && (!recent_transactions || recent_transactions.length === 0) ? (
            <ActivityIndicator color="#1D9E75" size="small" style={{ marginTop: 10 }} />
          ) : recent_transactions && recent_transactions.length > 0 ? (
            recent_transactions.map((tx: any) => (
              <View key={tx.id} style={styles.transactionCard}>
                {/* Carré vert d'illustration à gauche */}
                <View style={styles.transactionThumbnail} />
                
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionTitleText} numberOfLines={1}>
                    {tx.title}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {new Date(tx.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>

                {/* Montant stylisé selon le type : Vert si crédit (+) ou Noir/Rouge si débit (-) */}
                <Text style={[
                  styles.transactionAmount, 
                  { color: tx.display_type === 'credit' ? '#1D9E75' : '#000000' }
                ]}>
                  {tx.display_type === 'credit' ? '+' : '-'} {formatCurrency(tx.amount, currency)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Aucune transaction enregistrée.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' , marginTop: 18},
  header: { backgroundColor: '#1D9E75', paddingHorizontal: 24, paddingBottom: 48 },
  headerContent: { paddingTop: 20 },
  headerTitle: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontWeight: '700', letterSpacing: 1 },
  balanceText: { color: '#FFFFFF', fontSize: 38, fontWeight: '700', marginTop: 12, letterSpacing: 0.5 },
  loader: { marginVertical: 14, alignSelf: 'flex-start' },
  actionRow: { flexDirection: 'row', gap: 16, marginTop: 22 },
  actionButton: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(255, 255, 255, 0.35)', height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center', gap: 8 },
  actionButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  scrollContent: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 100 },
  errorContainer: { backgroundColor: '#FCE8E6', padding: 12, borderRadius: 12, marginBottom: 16 },
  errorText: { color: '#A94442', fontSize: 13, textAlign: 'center' },
  section: { marginBottom: 28 },
  transactionsSection: { marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#000000', marginBottom: 14 },
  sequestreCard: { backgroundColor: '#F9F8F6', borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  sequestreIllustration: { backgroundColor: '#EBF4E0', height: 110, width: '100%' },
  sequestreDetails: { padding: 16, gap: 4 },
  sequestreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sequestreProduct: { fontSize: 14, fontWeight: '700', color: '#000000' },
  sequestreStatus: { fontSize: 12, fontWeight: '700', color: '#000000' },
  sequestrePrice: { fontSize: 15, fontWeight: '700', color: '#000000', marginTop: 2 },
  transactionCard: { backgroundColor: '#F9F8F6', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12 },
  transactionThumbnail: { width: 44, height: 44, backgroundColor: '#EBF4E0', borderRadius: 12 },
  transactionInfo: { flex: 1, justifyContent: 'center' },
  transactionTitleText: { fontSize: 14, fontWeight: '700', color: '#000000', marginBottom: 4 },
  transactionDate: { fontSize: 12, color: '#666666' },
  transactionAmount: { fontSize: 15, fontWeight: '700' },
  emptyText: { fontSize: 14, color: '#999999', textAlign: 'center', marginTop: 10 },
});