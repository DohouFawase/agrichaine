import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  Text,
  StyleSheet,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import type { AppDispatch } from '@/stores';
import { fetchHome } from '@/providers/users/homeProviderAction';
import { useRouter } from 'expo-router';

import { selectProducerHome, selectHomeLoading, selectHomeError } from '@/slice/homeSlice';
import {
  fetchNotifications,
  fetchUnreadCount,
  fetchNotificationDetail,
} from '@/providers/notification/notificationsProvideraction';
import type { AppNotification } from '@/providers/notification/notificationsProvideraction';
import {
  selectNotifications,
  selectNotificationsUnreadCount,
  selectNotificationsLoading,
} from '@/slice/notificationSlice';
import WalletCard from '@/components/Walletcard';
import UserHeader from '@/components/Userheader';
import EmptyState from '@/components/Emptystate';
import OrderCard from '@/components/Ordercard';
import SectionHeader from '@/components/Sectionheader';
import { COLORS, ROLE_ACCENT, ROLE_ACCENT_SOFT, ROLE_LABEL, SPACING } from '@/hooks/theme';
import ProductCard from '@/components/Productcard';
import NotificationsDropdown from '@/components/NotificationsDropdown';
import type { ProductResource } from '@/types/home/homeType';
import echo from '@/utils/echo';

const ACCENT = ROLE_ACCENT.producer;
const ACCENT_SOFT = ROLE_ACCENT_SOFT.producer;

export default function ProducerHomeScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<any>();
  const router = useRouter();

  const home = useSelector(selectProducerHome);
  const loading = useSelector(selectHomeLoading);
  const error = useSelector(selectHomeError);

  const notifications = useSelector(selectNotifications);
  const unreadCount = useSelector(selectNotificationsUnreadCount);
  const notificationsLoading = useSelector(selectNotificationsLoading);

  // ✅ Visibilité du popup de notifications
  const [showNotifications, setShowNotifications] = useState(false);

  // ✅ Écoute temps réel sur LE CANAL DU PRODUCTEUR — pas marketplace.buyers
  // (réservé aux buyers, un producteur s'y ferait rejeter par
  // Broadcast::channel('marketplace.buyers', fn($user) => $user->role ===
  // 'buyer'), l'abonnement échouerait silencieusement).
  //
  // Ce canal `user.{id}` + l'event `.order.placed` correspondent
  // exactement à ce que diffuse App\Notifications\OrderPlacedForProducer
  // (voir broadcastOn() / broadcastType() côté backend).
  useEffect(() => {
    if (!home?.user?.id) return;

    let channel: any;
    const channelName = `user.${home.user.id}`;

    const setupChannel = async () => {
      channel = await echo.private(channelName);
      channel.listen('.order.placed', (data: any) => {
        console.log('🟢 Nouvelle commande reçue via Reverb :', data);

        // Rafraîchit le home (nouvelle commande visible dans "Commandes en cours")
        dispatch(fetchHome());

        // ⚠️ Le payload temps réel envoyé par toBroadcast() est
        // volontairement allégé (order_id, product_id, title, message,
        // created_at, id, type) — il NE correspond PAS à la forme
        // complète d'AppNotification (pas de price/quantity/producer/
        // read_at/updated_at). On ne le pousse donc PAS directement dans
        // le store : on se contente de rafraîchir le badge, et la liste
        // si le dropdown est ouvert, en repartant du backend qui a la
        // version complète et fiable de la notification.
        dispatch(fetchUnreadCount());
        if (showNotifications) {
          dispatch(fetchNotifications(1));
        }
      });
    };

    setupChannel();

    return () => {
      echo.leaveChannel(channelName);
    };
  }, [dispatch, home?.user?.id, showNotifications]);

  useEffect(() => {
    dispatch(fetchHome());
    dispatch(fetchUnreadCount()); // initialise le badge au chargement de l'écran
  }, [dispatch]);

  const handleRefresh = useCallback(() => {
    dispatch(fetchHome());
  }, [dispatch]);

  // ✅ Ouvre le popup et resynchronise badge + liste depuis le backend
  const handleNotificationPress = useCallback(() => {
    setShowNotifications(true);
    dispatch(fetchNotifications(1));
    dispatch(fetchUnreadCount());
  }, [dispatch]);

  const handleCloseNotifications = useCallback(() => {
    setShowNotifications(false);
  }, []);

  const handleNotificationItemPress = useCallback(
    (notification: AppNotification) => {
      setShowNotifications(false);
      dispatch(fetchNotificationDetail(notification.id));
      navigation.navigate('NotificationDetail', { id: notification.id });
    },
    [dispatch, navigation]
  );

  const handleSeeMore = useCallback(() => {
    setShowNotifications(false);
    router.push('/other/notification/notificationListScreen');
  }, [router]);



  const renderProduct = useCallback(
    ({ item }: { item: ProductResource }) => (
      <ProductCard product={item} accentColor={ACCENT} />
    ),
    []
  );

  const keyExtractor = useCallback((item: ProductResource) => String(item.id), []);

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
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} tintColor={ACCENT} />
        }
      >
        <UserHeader
          user={home.user}
          roleLabel={ROLE_LABEL.producer}
          accentColor={ACCENT}
          accentSoft={ACCENT_SOFT}
          unreadNotifications={unreadCount}
          onNotificationPress={handleNotificationPress}
        />
        <WalletCard
          balance={home.wallet.balance}
          currency={home.wallet.currency}
          accentColor={ACCENT}
          recentTransactions={home.wallet.recent_transactions}
        />
        <SectionHeader
          title="Commandes en cours"
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
          title="Mes produits"
          count={home.my_products.length}
          accentColor={ACCENT}
        />
        {home.my_products.length === 0 ? (
          <EmptyState message="Vous n'avez pas encore ajouté de produit." />
        ) : (
          <FlatList
            data={home.my_products}
            renderItem={renderProduct}
            keyExtractor={keyExtractor}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productsRow}
          />
        )}
      </ScrollView>

      <NotificationsDropdown
        visible={showNotifications}
        onClose={handleCloseNotifications}
        notifications={notifications}
        isLoading={notificationsLoading}
        accentColor={ACCENT}
        accentSoft={ACCENT_SOFT}
        onNotificationPress={handleNotificationItemPress}
        onSeeMore={handleSeeMore}
      />
    </>
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
  productsRow: {
    paddingHorizontal: SPACING.md,
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