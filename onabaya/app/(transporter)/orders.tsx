import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import {
  fetchOrdersAction,
  assignOrder,
} from '@/providers/orders/ordersProviderAction';
import type { OrderResource } from '@/providers/orders/ordersProviderAction';

export default function OrderListScreen() {
  const dispatch = useAppDispatch();
  const { orders, isLoading, error, userRole } = useAppSelector(
    (state) => state.orders
  );

  // Suivi local des courses en cours d'acceptation (pour désactiver le bouton)
  const [assigningId, setAssigningId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchOrdersAction());
  }, [dispatch]);

  const handleAccept = async (orderId: string) => {
    setAssigningId(orderId);
    const result = await dispatch(assignOrder(orderId));
    setAssigningId(null);

    if (assignOrder.rejected.match(result)) {
      // Ex: "Cette course a déjà été prise par un autre chauffeur."
      Alert.alert('Course indisponible', result.payload as string);
      dispatch(fetchOrdersAction()); // on rafraîchit la liste pour la retirer
    }
  };

  if (isLoading && orders.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1D9E75" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {userRole === 'transporter' ? 'Courses' : 'Mes commandes'}
      </Text>

      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Rechercher..."
          placeholderTextColor="#999"
          style={styles.searchInput}
        />
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          // Pour un chauffeur : une commande "paid_searching_driver" et sans
          // transporteur assigné = course disponible à prendre.
          const isAvailableForPickup =
            userRole === 'transporter' &&
            item.status === 'paid_searching_driver' &&
            !item.transporter_id;

          // Toujours visible aussi : ses propres courses déjà assignées
          // (assigned_to_driver / collected / delivered), gérées par le
          // fetch existant côté backend.

          return (
            <TouchableOpacity
              style={styles.orderCard}
              activeOpacity={0.7}
              onPress={() =>
                router.push({
                  pathname: '/other/orderdetailScreen',
                  params: { id: item.id },
                })
              }
            >
              <View style={styles.imagePlaceholder} />
              <View style={styles.orderInfo}>
                <Text style={styles.productName}>
                  {item.product?.name || 'Produit Vivrier'}
                </Text>
                <Text style={styles.quantity}>
                  Quantité : {item.quantity_ordered} {item.product?.unit || 'kg'}
                </Text>

                {isAvailableForPickup ? (
                  <View style={styles.availableBadge}>
                    <Text style={styles.availableBadgeText}>
                      ● Disponible
                    </Text>
                  </View>
                ) : (
                  <Text
                    style={[styles.status, { color: getStatusColor(item.status) }]}
                  >
                    {formatStatus(item.status, userRole)}
                  </Text>
                )}
              </View>

              {isAvailableForPickup ? (
                <TouchableOpacity
                  style={styles.acceptBtn}
                  disabled={assigningId === item.id}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleAccept(item.id);
                  }}
                >
                  {assigningId === item.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.acceptBtnText}>Accepter</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <Text style={styles.chevron}>›</Text>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const getStatusColor = (status: string) => {
  if (status === 'delivered') return '#1D9E75';
  if (status === 'assigned_to_driver' || status === 'collected') return '#E69B00';
  return '#999';
};

const formatStatus = (status: string, role: string | null) => {
  switch (status) {
    case 'paid_searching_driver':
      return 'Recherche chauffeur...';
    case 'assigned_to_driver':
      return 'Chauffeur en route';
    case 'collected':
      return 'En cours de transport';
    case 'delivered':
      return role === 'producer' ? 'Vendu & Livré' : 'Reçu';
    default:
      return status;
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', paddingHorizontal: 20, paddingTop: 54 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#000', marginBottom: 20, textAlign: 'center' },
  searchContainer: { backgroundColor: '#F9F8F6', borderRadius: 15, paddingHorizontal: 15, height: 50, justifyContent: 'center', marginBottom: 20 },
  searchInput: { fontSize: 16, color: '#000' },
  orderCard: { flexDirection: 'row', backgroundColor: '#F9F8F6', borderRadius: 16, padding: 15, marginBottom: 15, alignItems: 'center' },
  imagePlaceholder: { width: 60, height: 60, backgroundColor: '#E2F0D9', borderRadius: 12, marginRight: 15 },
  orderInfo: { flex: 1, justifyContent: 'center' },
  productName: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  quantity: { fontSize: 14, color: '#666', marginBottom: 4 },
  status: { fontSize: 14, fontWeight: '600' },
  chevron: { fontSize: 22, color: '#CCC', marginLeft: 8 },
  availableBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FAEEDA',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  availableBadgeText: { fontSize: 11, fontWeight: '700', color: '#854F0B' },
  acceptBtn: {
    backgroundColor: '#1D9E75',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    minWidth: 76,
    alignItems: 'center',
  },
  acceptBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});