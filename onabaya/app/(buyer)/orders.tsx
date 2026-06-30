import React, { useEffect } from 'react';
import { View, Text, FlatList, TextInput, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { fetchOrdersAction } from '@/providers/orders/ordersProviderAction';

export default function OrderListScreen() {
  const dispatch = useAppDispatch();
  const { orders, isLoading, error, userRole } = useAppSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchOrdersAction());
  }, [dispatch]);

  if (isLoading && orders.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1D9E75" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mes commandes</Text>

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
        renderItem={({ item }) => (
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
              <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
                {formatStatus(item.status, userRole)}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        )}
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
    case 'paid_searching_driver': return 'Recherche chauffeur...';
    case 'assigned_to_driver': return 'Chauffeur en route';
    case 'collected': return 'En cours de transport';
    case 'delivered': return role === 'producer' ? 'Vendu & Livré' : 'Reçu';
    default: return status;
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
});