import React, { useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  Text,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '@/stores';
import { fetchHome } from '@/providers/users/homeProviderAction';
import { selectBuyerHome, selectHomeLoading, selectHomeError } from '@/slice/homeSlice';



import { COLORS, ROLE_ACCENT, ROLE_ACCENT_SOFT, ROLE_LABEL } from '@/hooks/theme';
import EmptyState from '@/components/Emptystate';
import EscrowBlock from '@/components/Escrowblock';
import OrderCard from '@/components/Ordercard';
import ProductCard from '@/components/Productcard';
import SectionHeader from '@/components/Sectionheader';
import UserHeader from '@/components/Userheader';
import WalletCard from '@/components/Walletcard';

const ACCENT = ROLE_ACCENT.buyer;
const ACCENT_SOFT = ROLE_ACCENT_SOFT.buyer;

export default function BuyerHomeScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const home = useSelector(selectBuyerHome);
  const loading = useSelector(selectHomeLoading);
  const error = useSelector(selectHomeError);

  useEffect(() => {
    dispatch(fetchHome());
  }, [dispatch]);

  const handleRefresh = useCallback(() => {
    dispatch(fetchHome());
  }, [dispatch]);

  if (loading && !home) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  if (error && !home) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!home) return null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={handleRefresh} tintColor={ACCENT} />
      }
    >
      <UserHeader
        user={home.user}
        roleLabel={ROLE_LABEL.buyer}
        accentColor={ACCENT}
        accentSoft={ACCENT_SOFT}
      />

      <WalletCard
        balance={home.wallet.balance}
        currency={home.wallet.currency}
        accentColor={ACCENT}
        recentTransactions={home.wallet.recent_transactions}
        extra={<EscrowBlock escrow={home.wallet.escrow} accentColor={ACCENT} />}
      />

      <SectionHeader
        title="Mes commandes en cours"
        count={home.active_orders.length}
        accentColor={ACCENT}
      />
      {home.active_orders.length === 0 ? (
        <EmptyState message="Aucune commande en cours pour le moment." />
      ) : (
        home.active_orders.map((order) => (
          <OrderCard key={order.id} order={order} accentColor={ACCENT} />
        ))
      )}

      <SectionHeader
        title="Produits disponibles"
        count={home.available_products.length}
        accentColor={ACCENT}
      />
      {home.available_products.length === 0 ? (
        <EmptyState message="Aucun produit disponible pour le moment." />
      ) : (
        home.available_products.map((product) => (
          <ProductCard key={product.id} product={product} accentColor={ACCENT} showProducer />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingBottom: 40,
    paddingTop: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});