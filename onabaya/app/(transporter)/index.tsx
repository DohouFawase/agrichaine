import React, { useCallback, useEffect, useState } from 'react';
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
import { selectTransporterHome, selectHomeLoading, selectHomeError } from '@/slice/homeSlice';



import { COLORS, ROLE_ACCENT, ROLE_ACCENT_SOFT, ROLE_LABEL } from '@/hooks/theme';
import type { DriverStatusPayload } from '@/types/home/homeType';
import WalletCard from '@/components/Walletcard';
import UserHeader from '@/components/Userheader';
import DriverStatusToggle from '@/components/Driverstatustoggle';
import EmptyState from '@/components/Emptystate';
import OrderCard from '@/components/Ordercard';
import SectionHeader from '@/components/Sectionheader';
import TripCard from '@/components/Tripcar';

const ACCENT = ROLE_ACCENT.transporter;
const ACCENT_SOFT = ROLE_ACCENT_SOFT.transporter;

export default function TransporterHomeScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const home = useSelector(selectTransporterHome);
  const loading = useSelector(selectHomeLoading);
  const error = useSelector(selectHomeError);

  // TODO: brancher sur un vrai thunk updateDriverStatus quand disponible côté backend
  const [localDriverStatus, setLocalDriverStatus] = useState<DriverStatusPayload | null>(null);

  useEffect(() => {
    dispatch(fetchHome());
  }, [dispatch]);

  useEffect(() => {
    if (home?.driver_status) setLocalDriverStatus(home.driver_status);
  }, [home?.driver_status]);

  const handleRefresh = useCallback(() => {
    dispatch(fetchHome());
  }, [dispatch]);

  const handleStatusChange = useCallback((status: DriverStatusPayload['status']) => {
    setLocalDriverStatus((prev) => (prev ? { ...prev, status } : prev));
    // dispatch(updateDriverStatus(status)) — à implémenter côté API
  }, []);

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
        roleLabel={ROLE_LABEL.transporter}
        accentColor={ACCENT}
        accentSoft={ACCENT_SOFT}
      />

      <WalletCard
        balance={home.wallet.balance}
        currency={home.wallet.currency}
        accentColor={ACCENT}
        recentTransactions={home.wallet.recent_transactions}
      />

      {localDriverStatus && (
        <DriverStatusToggle
          driverStatus={localDriverStatus}
          accentColor={ACCENT}
          onChange={handleStatusChange}
        />
      )}

      <SectionHeader
        title="Mes livraisons en cours"
        count={home.my_active_orders.length}
        accentColor={ACCENT}
      />
      {home.my_active_orders.length === 0 ? (
        <EmptyState message="Aucune livraison en cours." />
      ) : (
        home.my_active_orders.map((order) => (
          <OrderCard key={order.id} order={order} accentColor={ACCENT} />
        ))
      )}

      <SectionHeader
        title="Commandes disponibles"
        count={home.available_orders.length}
        accentColor={ACCENT}
      />
      {home.available_orders.length === 0 ? (
        <EmptyState message="Aucune commande disponible pour le moment." />
      ) : (
        home.available_orders.map((order) => (
          <OrderCard key={order.id} order={order} accentColor={ACCENT} />
        ))
      )}

      <SectionHeader
        title="Mes trajets"
        count={home.my_trips.length}
        accentColor={ACCENT}
      />
      {home.my_trips.length === 0 ? (
        <EmptyState message="Vous n'avez pas encore de trajet enregistré." />
      ) : (
        home.my_trips.map((trip) => (
          <TripCard key={trip.id} trip={trip} accentColor={ACCENT} />
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