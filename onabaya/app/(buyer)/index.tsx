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
// ✅ Remplacement de l'import de useNavigation par useRouter d'expo-router
import { useRouter } from 'expo-router';
import type { AppDispatch } from '@/stores';
import { fetchHome } from '@/providers/users/homeProviderAction';
import { selectBuyerHome, selectHomeLoading, selectHomeError } from '@/slice/homeSlice';
import {
  fetchNotifications,
  fetchUnreadCount,
  fetchNotificationDetail,
} from '@/providers/notification/notificationsProvideraction';
import {
  selectNotifications,
  selectNotificationsUnreadCount,
  selectNotificationsLoading,
  addRealtimeNotification,
} from '@/slice/notificationSlice';
import type { AppNotification } from '@/providers/notification/notificationsProvideraction';
import { COLORS, ROLE_ACCENT, ROLE_ACCENT_SOFT, ROLE_LABEL, SPACING } from '@/hooks/theme';
import EmptyState from '@/components/Emptystate';
import EscrowBlock from '@/components/Escrowblock';
import OrderCard from '@/components/Ordercard';
import ProductCard from '@/components/Productcard';
import SectionHeader from '@/components/Sectionheader';
import UserHeader from '@/components/Userheader';
import WalletCard from '@/components/Walletcard';
import echo from '@/utils/echo';
import NotificationsDropdown from '@/components/NotificationsDropdown';
import type { ProductResource } from '@/types/home/homeType';

const ACCENT = ROLE_ACCENT.buyer;
const ACCENT_SOFT = ROLE_ACCENT_SOFT.buyer;

export default function BuyerHomeScreen() {
  const dispatch = useDispatch<AppDispatch>();
  // ✅ Initialisation du routeur Expo
  const router = useRouter();

  const home = useSelector(selectBuyerHome);
  const loading = useSelector(selectHomeLoading);
  const error = useSelector(selectHomeError);

  const notifications = useSelector(selectNotifications);
  const unreadCount = useSelector(selectNotificationsUnreadCount);
  const notificationsLoading = useSelector(selectNotificationsLoading);

  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    dispatch(fetchHome());
    dispatch(fetchUnreadCount());
  }, [dispatch]);

  useEffect(() => {
    let channel: any;

    const setupChannel = async () => {
      channel = await echo.private('marketplace.buyers');
      channel.listen('.product.created', (data: any) => {
        console.log('🟢 Nouveau produit reçu via Reverb :', data);
        dispatch(fetchHome());

        if (data?.notification) {
          dispatch(addRealtimeNotification(data.notification as AppNotification));
        } else {
          dispatch(fetchUnreadCount());
          if (showNotifications) {
            dispatch(fetchNotifications(1));
          }
        }
      });
    };

    setupChannel();

    return () => {
      echo.leaveChannel('marketplace.buyers');
    };
  }, [dispatch, showNotifications]);

  const handleRefresh = useCallback(() => {
    dispatch(fetchHome());
  }, [dispatch]);

  const handleNotificationPress = useCallback(() => {
    setShowNotifications(true);
    dispatch(fetchNotifications(1));
    dispatch(fetchUnreadCount());
  }, [dispatch]);

  const handleCloseNotifications = useCallback(() => {
    setShowNotifications(false);
  }, []);

  // ✅ Clic sur une notification avec Expo Router
  const handleNotificationItemPress = useCallback(
    (notification: AppNotification) => {
      setShowNotifications(false);
      dispatch(fetchNotificationDetail(notification.id));
      
      // Adaptation selon la structure de vos dossiers dans /app (ex: /notification/[id])
      router.push({
        pathname: '/other/notificationdetailScreen',
        params: { id: notification.id }
      });
    },
    [dispatch, router]
  );

  const renderProduct = useCallback(
    ({ item }: { item: ProductResource }) => (
      <ProductCard product={item} accentColor={ACCENT} showProducer />
    ),
    []
  );

  const keyExtractor = useCallback((item: ProductResource) => String(item.id), []);

  // ✅ "Voir plus" avec Expo Router (push empile par défaut la vue)
  const handleSeeMore = useCallback(() => {
    setShowNotifications(false);
    router.push('/other/notification/notificationListScreen');
  }, [router]);

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
          roleLabel={ROLE_LABEL.buyer}
          accentColor={ACCENT}
          accentSoft={ACCENT_SOFT}
          unreadNotifications={unreadCount}
          onNotificationPress={handleNotificationPress}
        />
        {/* <WalletCard
          balance={home.wallet.balance}
          currency={home.wallet.currency}
          accentColor={ACCENT}
          recentTransactions={home.wallet.recent_transactions}
          extra={<EscrowBlock escrow={home.wallet.escrow} accentColor={ACCENT} />}
        /> */}
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
          <FlatList
            data={home.available_products}
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