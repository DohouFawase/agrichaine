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

const NUM_COLUMNS = 2; // Tu peux passer à 2 ici si tu veux tester un rendu côte à côte

export default function OrderListScreen() {
  const dispatch = useAppDispatch();
  const { orders, isLoading, error, userRole } = useAppSelector(
    (state) => state.orders
  );

  const [assigningId, setAssigningId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchOrdersAction());
  }, [dispatch]);

  const handleAccept = async (orderId: string) => {
    setAssigningId(orderId);
    const result = await dispatch(assignOrder(orderId));
    setAssigningId(null);

    if (assignOrder.rejected.match(result)) {
      Alert.alert('Course indisponible', result.payload as string);
      dispatch(fetchOrdersAction());
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
        key={NUM_COLUMNS} // Fix pour éviter l'erreur Invariant Violation
        data={orders}
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLUMNS}
        columnWrapperStyle={NUM_COLUMNS > 1 ? styles.row : null}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isAvailableForPickup =
            userRole === 'transporter' &&
            item.status === 'paid_searching_driver' &&
            !item.transporter_id;

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
              
              <View style={styles.cardContent}>
                <View style={styles.orderInfo}>
                  <Text style={styles.productName} numberOfLines={1}>
                    {item.product?.name || 'Produit Vivrier'}
                  </Text>
                  <Text style={styles.quantity}>
                    {item.quantity_ordered} {item.product?.unit || 'kg'}
                  </Text>

                  {isAvailableForPickup ? (
                    <View style={styles.availableBadge}>
                      <Text style={styles.availableBadgeText}>● Disponible</Text>
                    </View>
                  ) : (
                    <Text
                      style={[styles.status, { color: getStatusColor(item.status) }]}
                    >
                      {formatStatus(item.status, userRole)}
                    </Text>
                  )}
                </View>

                <View style={styles.actionContainer}>
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
                    <Text style={styles.chevron}>Voir détails ›</Text>
                  )}
                </View>
              </View>
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
  container: { flex: 1, backgroundColor: '#FFF', paddingHorizontal: 15, paddingTop: 54 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#000', marginBottom: 20, textAlign: 'center' },
  searchContainer: { backgroundColor: '#F9F8F6', borderRadius: 15, paddingHorizontal: 15, height: 50, justifyContent: 'center', marginBottom: 20 },
  searchInput: { fontSize: 16, color: '#000' },
  row: { flex: 1, justifyContent: 'space-between' },
  orderCard: { 
    flex: 1,
    backgroundColor: '#F9F8F6', 
    borderRadius: 16, 
    marginBottom: 15, 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    marginHorizontal: NUM_COLUMNS > 1 ? 5 : 0 // Marges si multi-colonnes
  },
  imagePlaceholder: { 
    width: '100%', 
    height: 120, 
    backgroundColor: '#E2F0D9' 
  },
  cardContent: {
    padding: 15,
  },
  orderInfo: { marginBottom: 12 },
  productName: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  quantity: { fontSize: 14, color: '#666', marginBottom: 6 },
  status: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  actionContainer: {
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 10,
    alignItems: 'stretch'
  },
  chevron: { fontSize: 14, color: '#1D9E75', fontWeight: '600', textAlign: 'right' },
  availableBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FAEEDA',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 4
  },
  availableBadgeText: { fontSize: 11, fontWeight: '700', color: '#854F0B' },
  acceptBtn: {
    backgroundColor: '#1D9E75',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    width: '100%'
  },
  acceptBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});