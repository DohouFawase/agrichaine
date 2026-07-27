import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  ArrowLeft,
  Package,
  Edit2,
  Trash2,
  Eye,
  ShoppingBag,
  MapPin,
  Minus,
  Plus,
  Store,
  Truck,
  Receipt,
  AlertTriangle,
  CheckCircle2,
  Box,
  TrendingUp,
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
  const userRole = user?.role;

  const { currentProduct, isLoading, error, views } = useAppSelector((state) => state.products);
  const { isActionLoading: isOrderLoading } = useAppSelector((s) => s.orders);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [deliveryFee, setDeliveryFee] = useState('');

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
        <Text style={styles.loadingText}>Chargement du produit...</Text>
      </View>
    );
  }

  if (error || !currentProduct) {
    return (
      <View style={styles.center}>
        <AlertTriangle size={48} color="#EF4444" strokeWidth={1.5} />
        <Text style={styles.errorText}>{error ?? 'Produit introuvable.'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
          <Text style={styles.retryText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isProducer = userRole === 'producer';
  const maxQuantity = currentProduct.quantity ?? 1;

  const estimatedTotal = quantity * currentProduct.price_per_unit;
  const parsedDeliveryFee = Number(deliveryFee) || 0;
  const isDeliveryFeeValid = deliveryFee.trim().length > 0 && parsedDeliveryFee > 0;
  const estimatedGrandTotal = estimatedTotal + parsedDeliveryFee;

  const handleDecrement = () => setQuantity((q) => Math.max(1, q - 1));
  const handleIncrement = () => setQuantity((q) => Math.min(maxQuantity, q + 1));

  const handleOrder = async () => {
    if (!isDeliveryFeeValid) {
      console.warn('⚠️ [handleOrder] Frais de livraison non renseignés ou invalides');
      return;
    }

    console.log('🛒 [handleOrder] Démarrage de la commande');
    console.log('🛒 [handleOrder] Payload envoyé:', {
      product_id: currentProduct.id,
      quantity_ordered: quantity,
      total_price: estimatedTotal,
      delivery_price: parsedDeliveryFee,
    });

    const result = await dispatch(
      createOrder({
        product_id: currentProduct.id,
        quantity_ordered: quantity,
        total_price: estimatedTotal,
        delivery_price: parsedDeliveryFee,
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* ── Header Flottant ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color="#0F172A" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détail du produit</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Image ── */}
        <View style={styles.heroBox}>
          <View style={styles.heroIconWrap}>
            <Package size={48} color="#1D9E75" strokeWidth={1.5} />
          </View>
          <View style={[styles.statusBadge, { backgroundColor: currentProduct.status === 'active' ? '#ECFDF5' : '#F3F4F6' }]}>
            <View style={[styles.statusDot, { backgroundColor: currentProduct.status === 'active' ? '#059669' : '#6B7280' }]} />
            <Text style={[styles.statusText, { color: currentProduct.status === 'active' ? '#059669' : '#6B7280' }]}>
              {currentProduct.status === 'active' ? 'En vente' : currentProduct.status}
            </Text>
          </View>
        </View>

        {/* ── Infos Principales ── */}
        <View style={styles.infoCard}>
          <Text style={styles.productName}>{currentProduct.name}</Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(currentProduct.price_per_unit)}</Text>
            <Text style={styles.priceUnit}> / {currentProduct.unit}</Text>
          </View>

          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Box size={14} color="#64748B" />
              <Text style={styles.metaText}>Stock: {currentProduct.quantity} {currentProduct.unit}</Text>
            </View>
            <View style={styles.metaItem}>
              <MapPin size={14} color="#64748B" />
              <Text style={styles.metaText}>{currentProduct.location}</Text>
            </View>
          </View>

          {/* Producteur (si info dispo) */}
          {(currentProduct as any).producer?.name && (
            <View style={styles.sellerRow}>
              <View style={styles.sellerIconBox}>
                <Store size={16} color="#1D9E75" />
              </View>
              <View>
                <Text style={styles.sellerLabel}>Vendu par</Text>
                <Text style={styles.sellerName}>
                  {(currentProduct as any).producer.name} {(currentProduct as any).producer.last_name || ''}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ═══════════════════════════════════════════════════════════
            VUE PRODUCTEUR
        ═══════════════════════════════════════════════════════════ */}
        {isProducer && (
          <>
            {/* Stats */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <TrendingUp size={16} color="#64748B" />
                <Text style={styles.sectionTitle}>Performance</Text>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <View style={[styles.statIconBox, { backgroundColor: '#EFF6FF' }]}>
                    <Eye size={20} color="#2563EB" />
                  </View>
                  <Text style={styles.statValue}>{viewCount}</Text>
                  <Text style={styles.statLabel}>Vue{viewCount > 1 ? 's' : ''}</Text>
                </View>
                <View style={styles.statBox}>
                  <View style={[styles.statIconBox, { backgroundColor: '#ECFDF5' }]}>
                    <ShoppingBag size={20} color="#059669" />
                  </View>
                  <Text style={styles.statValue}>2</Text>
                  <Text style={styles.statLabel}>Commandes</Text>
                </View>
                <View style={styles.statBox}>
                  <View style={[styles.statIconBox, { backgroundColor: '#FFFBEB' }]}>
                    <Receipt size={20} color="#D97706" />
                  </View>
                  <Text style={styles.statValue}>{formatPrice(currentProduct.quantity * currentProduct.price_per_unit)}</Text>
                  <Text style={styles.statLabel}>Valeur stock</Text>
                </View>
              </View>
            </View>

            {/* Localisation détaillée */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <MapPin size={16} color="#64748B" />
                <Text style={styles.sectionTitle}>Localisation</Text>
              </View>
              <View style={styles.locationRow}>
                <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
                  <MapPin size={18} color="#2563EB" />
                </View>
                <Text style={styles.locationText}>{currentProduct.location}</Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnEdit]}
                onPress={() =>
                  router.push({
                    pathname: '/other/producer/storeproductScreen',
                    params: { id },
                  })
                }
              >
                <Edit2 size={18} color="#0F172A" />
                <Text style={styles.actionBtnEditText}>Modifier</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnDelete]}
                onPress={() => setShowDeleteModal(true)}
              >
                <Trash2 size={18} color="#EF4444" />
                <Text style={styles.actionBtnDeleteText}>Retirer</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════
            VUE ACHETEUR
        ═══════════════════════════════════════════════════════════ */}
        {!isProducer && (
          <>
            {/* Quantité */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Box size={16} color="#64748B" />
                <Text style={styles.sectionTitle}>Quantité à commander</Text>
              </View>
              
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={[styles.stepperBtn, quantity <= 1 && styles.stepperBtnDisabled]}
                  onPress={handleDecrement}
                  disabled={quantity <= 1}
                >
                  <Minus size={18} color={quantity <= 1 ? '#CBD5E1' : '#FFF'} />
                </TouchableOpacity>

                <View style={styles.stepperValueBox}>
                  <Text style={styles.stepperValue}>{quantity}</Text>
                  <Text style={styles.stepperUnit}>{currentProduct.unit}</Text>
                </View>

                <TouchableOpacity
                  style={[styles.stepperBtn, quantity >= maxQuantity && styles.stepperBtnDisabled]}
                  onPress={handleIncrement}
                  disabled={quantity >= maxQuantity}
                >
                  <Plus size={18} color={quantity >= maxQuantity ? '#CBD5E1' : '#FFF'} />
                </TouchableOpacity>
              </View>

              <Text style={styles.stepperHint}>
                Maximum disponible : {maxQuantity} {currentProduct.unit}
              </Text>
            </View>

            {/* Frais de livraison */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Truck size={16} color="#64748B" />
                <Text style={styles.sectionTitle}>Frais de livraison</Text>
              </View>
              
              <View style={[
                styles.inputBox,
                !isDeliveryFeeValid && deliveryFee.length > 0 && styles.inputBoxError
              ]}>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="Ex: 1500"
                  placeholderTextColor="#94A3B8"
                  value={deliveryFee}
                  onChangeText={setDeliveryFee}
                />
                <Text style={styles.inputSuffix}>FCFA</Text>
              </View>
              
              {!isDeliveryFeeValid && deliveryFee.length > 0 && (
                <Text style={styles.inputError}>Veuillez saisir un montant valide</Text>
              )}
            </View>

            {/* Récapitulatif */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Receipt size={16} color="#64748B" />
                <Text style={styles.sectionTitle}>Récapitulatif</Text>
              </View>
              
              <View style={styles.recapRow}>
                <Text style={styles.recapLabel}>{quantity} × {currentProduct.name}</Text>
                <Text style={styles.recapValue}>{formatPrice(estimatedTotal)}</Text>
              </View>
              <View style={styles.recapRow}>
                <Text style={styles.recapLabel}>Frais de livraison</Text>
                <Text style={styles.recapValue}>
                  {isDeliveryFeeValid ? formatPrice(parsedDeliveryFee) : '—'}
                </Text>
              </View>
              <View style={styles.recapDivider} />
              <View style={styles.recapRow}>
                <Text style={styles.recapTotalLabel}>Total estimé</Text>
                <Text style={styles.recapTotalValue}>
                  {isDeliveryFeeValid ? formatPrice(estimatedGrandTotal) : formatPrice(estimatedTotal)}
                </Text>
              </View>
            </View>

            {/* CTA Commander */}
            <TouchableOpacity
              style={[
                styles.orderBtn,
                (!isDeliveryFeeValid || isOrderLoading) && styles.orderBtnDisabled
              ]}
              onPress={handleOrder}
              disabled={isOrderLoading || !isDeliveryFeeValid}
            >
              {isOrderLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <ShoppingBag size={20} color="#FFF" />
                  <Text style={styles.orderBtnText}>
                    Commander · {isDeliveryFeeValid ? formatPrice(estimatedGrandTotal) : formatPrice(estimatedTotal)}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* Spacer bottom */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Modal Suppression ── */}
      <DeleteProductModal
        visible={showDeleteModal}
        productName={currentProduct.name}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={() => {
          setShowDeleteModal(false);
          router.back();
        }}
      />
    </KeyboardAvoidingView>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 40,
  },
  loadingText: { marginTop: 16, fontSize: 15, color: '#64748B', fontWeight: '500' },
  errorText: { marginTop: 16, fontSize: 16, color: '#64748B', textAlign: 'center', marginBottom: 20, fontWeight: '500' },
  retryBtn: { backgroundColor: '#1D9E75', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 },
  retryText: { color: '#FFF', fontWeight: '700', fontSize: 15 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 24,
    backgroundColor: '#F8FAFC',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 20 },

  // Hero
  heroBox: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    position: 'relative',
  },
  heroIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '700' },

  // Info Card
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  productName: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 8, letterSpacing: -0.3 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 16 },
  price: { fontSize: 24, fontWeight: '800', color: '#1D9E75' },
  priceUnit: { fontSize: 15, fontWeight: '600', color: '#94A3B8', marginLeft: 4 },
  metaGrid: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  sellerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '600', marginBottom: 2 },
  sellerName: { fontSize: 14, fontWeight: '700', color: '#0F172A' },

  // Section Card (réutilisable)
  sectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Producteur — Stats
  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },

  // Producteur — Localisation
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationText: { fontSize: 15, fontWeight: '600', color: '#0F172A', flex: 1 },

  // Producteur — Actions
  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 4, marginBottom: 20 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 54,
    borderRadius: 16,
  },
  actionBtnEdit: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  actionBtnEditText: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  actionBtnDelete: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  actionBtnDeleteText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },

  // Acheteur — Stepper
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  stepperBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#1D9E75',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1D9E75',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  stepperBtnDisabled: { backgroundColor: '#F1F5F9', shadowOpacity: 0 },
  stepperValueBox: { alignItems: 'center', minWidth: 80 },
  stepperValue: { fontSize: 28, fontWeight: '800', color: '#0F172A' },
  stepperUnit: { fontSize: 13, color: '#94A3B8', fontWeight: '600', marginTop: 2 },
  stepperHint: { textAlign: 'center', marginTop: 14, fontSize: 12, color: '#94A3B8', fontWeight: '500' },

  // Acheteur — Input livraison
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    height: 56,
  },
  inputBoxError: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  input: { flex: 1, fontSize: 17, fontWeight: '700', color: '#0F172A' },
  inputSuffix: { fontSize: 15, fontWeight: '600', color: '#94A3B8', marginLeft: 8 },
  inputError: { marginTop: 8, fontSize: 12, fontWeight: '600', color: '#EF4444' },

  // Acheteur — Récap
  recapRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  recapLabel: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  recapValue: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  recapDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 8 },
  recapTotalLabel: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  recapTotalValue: { fontSize: 18, fontWeight: '800', color: '#1D9E75' },

  // Acheteur — CTA
  orderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#0F172A',
    height: 60,
    borderRadius: 18,
    marginTop: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  orderBtnDisabled: { backgroundColor: '#CBD5E1', shadowOpacity: 0 },
  orderBtnText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
});