import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import {
  Package,
  Edit2,
  Trash2,
  Eye,
  ShoppingBag,
  MapPin,
  Minus,
  Plus,
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { fetchProductDetails } from '@/providers/producers/producersProviderAction';
import { createOrder } from '@/providers/orders/ordersProviderAction';
import { incrementView } from '@/slice/productsSlice';
import DeleteProductModal from '@/components/DeleteProductModal';

export default function ProductDetailScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { id } = useLocalSearchParams<{ id: string }>();

  const { user } = useAppSelector((s) => s.auth);
  const userRole = user?.role; // 'producer' | 'buyer' | 'transporter'

  const { currentProduct, isLoading, error, views } = useAppSelector(
    (state) => state.products
  );
  const { isActionLoading: isOrderLoading } = useAppSelector((s) => s.orders);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const viewCount = id ? (views[id] ?? 0) : 0;

  useEffect(() => {
    if (id) {
      dispatch(fetchProductDetails(id));
      dispatch(incrementView(id));
    }
  }, [id, dispatch]);

  const formatPrice = (amount: number) =>
    `${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} F`;

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1D9E75" />
      </View>
    );
  }

  if (error || !currentProduct) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error ?? 'Produit introuvable.'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
          <Text style={styles.retryText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isProducer = userRole === 'producer';
  const maxQuantity = currentProduct.quantity ?? 1;

  // Estimation côté client : la vraie source de vérité reste le calcul backend
  // au moment de la création, mais c'est utile pour afficher le total avant validation.
  const estimatedTotal = quantity * currentProduct.price_per_unit;
  const estimatedDeliveryFee = 1500; // valeur d'exemple, à remplacer par ton calcul réel de livraison
  const estimatedGrandTotal = estimatedTotal + estimatedDeliveryFee;

  const handleDecrement = () => setQuantity((q) => Math.max(1, q - 1));
  const handleIncrement = () =>
    setQuantity((q) => Math.min(maxQuantity, q + 1));

  const handleOrder = async () => {
    console.log('🛒 [handleOrder] Démarrage de la commande');
    console.log('🛒 [handleOrder] Payload envoyé:', {
      product_id: currentProduct.id,
      quantity_ordered: quantity,
      total_price: estimatedTotal,
      delivery_price: estimatedDeliveryFee,
    });

    const result = await dispatch(
      createOrder({
        product_id: currentProduct.id,
        quantity_ordered: quantity,
        total_price: estimatedTotal,
        delivery_price: estimatedDeliveryFee,
      })
    );

    console.log('🛒 [handleOrder] Résultat brut du thunk:', result);

    if (createOrder.fulfilled.match(result)) {
      console.log('✅ [handleOrder] Commande créée avec succès');
      console.log('✅ [handleOrder] Payload reçu:', result.payload);

      const orderId = (result.payload as any)?.order_id;
      console.log('✅ [handleOrder] order_id extrait:', orderId);

      if (!orderId) {
        console.warn('⚠️ [handleOrder] order_id est undefined — vérifie la structure de CreateOrderResponse côté backend/thunk.');
      }

      router.push({
        pathname: '/other/orderdetailScreen',
        params: { id: orderId },
      });
      console.log('➡️ [handleOrder] Navigation vers orderdetailScreen avec id:', orderId);
    } else {
      console.error('❌ [handleOrder] Échec de la création de commande');
      console.error('❌ [handleOrder] Raison du rejet:', result.payload);
    }
  };
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <SafeAreaView edges={['top']}>
        <View style={styles.imagePlaceholder}>
          <Package size={48} color="#1D9E75" opacity={0.3} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.row}>
          <View>
            <Text style={styles.productTitle}>
              {currentProduct.name} · {currentProduct.quantity} {currentProduct.unit}
            </Text>
            <Text style={styles.productPrice}>
              {formatPrice(currentProduct.price_per_unit)} / {currentProduct.unit}
            </Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {currentProduct.status === 'active' ? 'En vente' : currentProduct.status}
            </Text>
          </View>
        </View>

        {/* ── Vue PRODUCTEUR : stats + gestion ──────────────────────────── */}
        {isProducer && (
          <>
            <Text style={styles.sectionLabel}>Vues / intérêts</Text>
            <View style={styles.statRow}>
              <View style={styles.statCard}>
                <Eye size={16} color="#666" style={{ marginBottom: 4 }} />
                <Text style={styles.statText}>{viewCount} Vue{viewCount > 1 ? 's' : ''}</Text>
              </View>
              <View style={styles.statCard}>
                <ShoppingBag size={16} color="#666" style={{ marginBottom: 4 }} />
                <Text style={styles.statText}>2 Commandes</Text>
              </View>
            </View>

            <Text style={styles.sectionLabel}>Localisation</Text>
            <View style={styles.locationCard}>
              <MapPin size={16} color="#666" style={{ marginRight: 8 }} />
              <Text style={styles.locationText}>{currentProduct.location}</Text>
            </View>

            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.btn, styles.btnEdit]}
                onPress={() =>
                  router.push({
                    pathname: '/other/producer/storeproductScreen',
                    params: { id },
                  })
                }
              >
                <Edit2 size={16} color="#000" />
                <Text style={styles.btnEditText}>Modifier</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btn, styles.btnDelete]}
                onPress={() => setShowDeleteModal(true)}
              >
                <Trash2 size={16} color="#D32F2F" />
                <Text style={styles.btnDeleteText}>Retirer</Text>
              </TouchableOpacity>
            </View>

            <DeleteProductModal
              visible={showDeleteModal}
              productName={currentProduct.name}
              onCancel={() => setShowDeleteModal(false)}
              onConfirm={() => {
                setShowDeleteModal(false);
                // dispatch(deleteProduct(id));
                router.back();
              }}
            />
          </>
        )}

        {/* ── Vue ACHETEUR : avis + quantité + commande ─────────────────── */}
        {!isProducer && (
          <>
            <View style={styles.reviewCard}>
              <View style={styles.reviewThumb} />
              <Text style={styles.reviewTitle}>Avis</Text>
            </View>

            <Text style={styles.sectionLabel}>Quantité à commander</Text>
            <View style={styles.stepperCard}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={handleDecrement}
                disabled={quantity <= 1}
              >
                <Minus size={16} color="#FFF" />
              </TouchableOpacity>

              <Text style={styles.stepperValue}>
                {quantity} {currentProduct.unit}
              </Text>

              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={handleIncrement}
                disabled={quantity >= maxQuantity}
              >
                <Plus size={16} color="#FFF" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.orderBtn}
              onPress={handleOrder}
              disabled={isOrderLoading}
            >
              {isOrderLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.orderBtnText}>
                  Commander · {formatPrice(estimatedGrandTotal)}
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  imagePlaceholder: { height: 200, backgroundColor: '#EBF4E0', justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  productTitle: { fontSize: 18, fontWeight: '700', color: '#000', marginBottom: 4 },
  productPrice: { fontSize: 15, color: '#1D9E75', fontWeight: '600' },
  badge: { backgroundColor: '#EBF4E0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5 },
  badgeText: { color: '#1D9E75', fontSize: 13, fontWeight: '700' },
  sectionLabel: { fontSize: 14, color: '#666', marginBottom: 10, marginTop: 6 },

  // Producteur
  statRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 12, padding: 14 },
  statText: { fontSize: 14, color: '#000', fontWeight: '500' },
  locationCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 12, padding: 14, marginBottom: 28 },
  locationText: { fontSize: 14, color: '#000', fontWeight: '500' },
  btnRow: { flexDirection: 'row', gap: 14 },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 15 },
  btnEdit: { backgroundColor: '#F5F5F5' },
  btnEditText: { fontSize: 15, fontWeight: '600', color: '#000' },
  btnDelete: { backgroundColor: '#FFF0F0' },
  btnDeleteText: { fontSize: 15, fontWeight: '600', color: '#D32F2F' },

  // Acheteur
  reviewCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#F5F5F5', borderRadius: 16, padding: 16, marginBottom: 24 },
  reviewThumb: { width: 56, height: 56, borderRadius: 12, backgroundColor: '#D5E9C2' },
  reviewTitle: { fontSize: 17, fontWeight: '700', color: '#000' },
  stepperCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F5F5F5', borderRadius: 16, paddingVertical: 18, paddingHorizontal: 16, marginBottom: 28 },
  stepperBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#1D9E75', justifyContent: 'center', alignItems: 'center' },
  stepperValue: { fontSize: 16, fontWeight: '600', color: '#000' },
  orderBtn: { backgroundColor: '#1D3D6B', borderRadius: 16, height: 56, justifyContent: 'center', alignItems: 'center' },
  orderBtnText: { fontSize: 17, fontWeight: '700', color: '#FFF' },

  errorText: { color: '#D32F2F', fontSize: 14, textAlign: 'center', marginBottom: 16 },
  retryBtn: { backgroundColor: '#1D9E75', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#FFF', fontWeight: '600' },
});