import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Dimensions,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { fetchOrderDetails, validateOrderCollection } from '@/providers/orders/ordersProviderAction';
import { clearCurrentOrder, clearOrderStrings } from '@/slice/orderSlice';
import QRCode from 'react-native-qrcode-svg';
import { ArrowLeft, Package, User, Truck } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const QR_SIZE = width * 0.58;

// ─── Helpers ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; dot: string }
> = {
  paid_searching_driver: {
    label: 'En attente de collecte',
    color: '#2563EB',
    bg: '#EFF6FF',
    dot: '#93C5FD',
  },
  assigned_to_driver: {
    label: 'Chauffeur assigné',
    color: '#D97706',
    bg: '#FFFBEB',
    dot: '#FCD34D',
  },
  collected: {
    label: 'En cours de transport',
    color: '#D97706',
    bg: '#FFFBEB',
    dot: '#FCD34D',
  },
  delivered: {
    label: 'Vendu & Livré',
    color: '#059669',
    bg: '#ECFDF5',
    dot: '#6EE7B7',
  },
};

const getStatus = (status: string) =>
  STATUS_CONFIG[status] ?? {
    label: status,
    color: '#6B7280',
    bg: '#F9FAFB',
    dot: '#D1D5DB',
  };

const formatPrice = (amount: number, currency = 'FCFA') =>
  `${amount.toLocaleString('fr-FR')} ${currency}`;

// ─── SearchingDriver ─────────────────────────────────────────────────────────

function SearchingDriver() {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;
  const truckX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const makeDot = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(val, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ])
      );

    makeDot(dot1, 0).start();
    makeDot(dot2, 180).start();
    makeDot(dot3, 360).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(truckX, { toValue: 10, duration: 500, useNativeDriver: true }),
        Animated.timing(truckX, { toValue: -10, duration: 500, useNativeDriver: true }),
        Animated.timing(truckX, { toValue: 0, duration: 250, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.searchingContainer}>
      <Animated.View style={[styles.searchingIconBox, { transform: [{ translateX: truckX }] }]}>
        <Truck size={22} color="#6B7280" />
      </Animated.View>
      <View style={styles.searchingTextRow}>
        <Text style={styles.searchingText}>Recherche en cours</Text>
        <View style={styles.dotsRow}>
          {[dot1, dot2, dot3].map((dot, i) => (
            <Animated.View key={i} style={[styles.dot, { opacity: dot }]} />
          ))}
        </View>
      </View>
      <Text style={styles.searchingSubText}>
        Un transporteur sera assigné automatiquement
      </Text>
    </View>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { currentOrder: order, isLoading, isActionLoading, error, successMessage } = useAppSelector(
    (s) => s.orders
  );

  const pulse = useRef(new Animated.Value(1)).current;

  // Modal de confirmation collecte
  const [showModal, setShowModal] = useState(false);
  const [quantityInput, setQuantityInput] = useState('');

  useEffect(() => {
    if (id) dispatch(fetchOrderDetails(id));
    return () => { dispatch(clearCurrentOrder()); };
  }, [id]);

  // Succès → fermer modal + refresh
  useEffect(() => {
    if (successMessage) {
      setShowModal(false);
      setQuantityInput('');
      Alert.alert('✅ Collecte validée', successMessage, [
        { text: 'OK', onPress: () => dispatch(clearOrderStrings()) },
      ]);
      if (id) dispatch(fetchOrderDetails(id));
    }
  }, [successMessage]);

  // Erreur action
  useEffect(() => {
    if (error) {
      Alert.alert('Erreur', error, [
        { text: 'OK', onPress: () => dispatch(clearOrderStrings()) },
      ]);
    }
  }, [error]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.5, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error ?? 'Commande introuvable.'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => id && dispatch(fetchOrderDetails(id))}>
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const status = getStatus(order.status);
  const isWaitingPickup = order.status === 'paid_searching_driver';
  const qrValue = order.verification_code_collection ?? order.id;
  const netAmount = order.total_price - order.delivery_fees;

  return (
    <View style={styles.root}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <ArrowLeft size={18} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Commande #{order.id.slice(-4).toUpperCase()}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Status Badge ── */}
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Animated.View
            style={[
              styles.statusDot,
              { backgroundColor: status.dot, transform: [{ scale: pulse }] },
            ]}
          />
          <Text style={[styles.statusLabel, { color: status.color }]}>
            {status.label}
          </Text>
        </View>

        {/* ── Product Info ── */}
        <View style={styles.section}>
          <View style={styles.productRow}>
            {/* Box Lucide Package */}
            <View style={[styles.iconBox, { backgroundColor: '#EBF4E0' }]}>
              <Package size={24} color="#1D9E75" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.productName}>{order.product?.name}</Text>
              <Text style={styles.productMeta}>
                {order.quantity_ordered} {order.product?.unit} · {order.product?.location}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Financial Summary ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Résumé financier</Text>
          <View style={styles.financeRow}>
            <Text style={styles.financeLabel}>Prix total</Text>
            <Text style={styles.financeValue}>{formatPrice(order.total_price)}</Text>
          </View>
          <View style={styles.dividerDashed} />
          <View style={styles.financeRow}>
            <Text style={styles.financeLabel}>Frais de livraison</Text>
            <Text style={[styles.financeValue, { color: '#EF4444' }]}>
              − {formatPrice(order.delivery_fees)}
            </Text>
          </View>
          <View style={styles.dividerDashed} />
          <View style={styles.financeRow}>
            <Text style={[styles.financeLabel, { fontWeight: '700', color: '#111' }]}>
              Vous recevrez
            </Text>
            <Text style={[styles.financeValue, { fontWeight: '700', color: '#059669', fontSize: 17 }]}>
              {formatPrice(netAmount)}
            </Text>
          </View>
        </View>

        {/* ── Buyer Info ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acheteur</Text>
          <View style={styles.infoRow}>
            {/* Box Lucide User */}
            <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
              <User size={20} color="#2563EB" />
            </View>
            <View>
              <Text style={styles.infoMain}>{order.buyer?.name} {order.buyer?.last_name}</Text>
              <Text style={styles.infoSub}>{order.buyer?.phone}</Text>
            </View>
          </View>
        </View>

        {/* ── Transporter Info ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transporteur</Text>
          {order.transporter ? (
            <View style={styles.infoRow}>
              {/* Box Lucide Truck */}
              <View style={[styles.iconBox, { backgroundColor: '#FFFBEB' }]}>
                <Truck size={20} color="#D97706" />
              </View>
              <View>
                <Text style={styles.infoMain}>{order.transporter.name}</Text>
              </View>
            </View>
          ) : (
            <SearchingDriver />
          )}
        </View>

        {/* ── QR Code Section ── */}
        {isWaitingPickup && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Code de collecte</Text>
            <Text style={styles.qrInstruction}>
              Montrez ce code au transporteur lors de la collecte
            </Text>
            <View style={styles.qrCard}>
              <QRCode
                value={qrValue}
                size={QR_SIZE}
                color="#111827"
                backgroundColor="transparent"
                logo={undefined}
              />
            </View>
            <Text style={styles.qrCode}>{qrValue.slice(0, 8).toUpperCase()}</Text>
          </View>
        )}

        {/* ── Order Meta ── */}
        <View style={[styles.section, { marginBottom: 100 }]}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Commande passée le</Text>
            <Text style={styles.metaValue}>
              {new Date(order.created_at).toLocaleDateString('fr-FR', {
                day: '2-digit', month: 'short', year: 'numeric',
              })}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Dernière mise à jour</Text>
            <Text style={styles.metaValue}>
              {new Date(order.updated_at).toLocaleDateString('fr-FR', {
                day: '2-digit', month: 'short', year: 'numeric',
              })}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ── CTA ── */}
      {isWaitingPickup && (
        <View style={styles.ctaContainer}>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => setShowModal(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaText}>Marquer comme prêt</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Modal validation collecte ── */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowModal(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalSheet}>

            {/* Handle */}
            <View style={styles.modalHandle} />

            <Text style={styles.modalTitle}>Confirmer la collecte</Text>
            <Text style={styles.modalSubtitle}>
              Le transporteur a scanné votre QR code. Indiquez la quantité réellement collectée.
            </Text>

            {/* Quantité */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Quantité collectée ({order?.product?.unit})</Text>
              <TextInput
                style={styles.input}
                value={quantityInput}
                onChangeText={setQuantityInput}
                keyboardType="numeric"
                placeholder={`Max. ${order?.quantity_ordered}`}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Boutons */}
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.modalBtnCancelText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalBtnConfirm,
                  (!quantityInput || isActionLoading) && { opacity: 0.5 },
                ]}
                disabled={!quantityInput || isActionLoading}
                onPress={() => {
                  if (!id || !qrValue) return;
                  dispatch(validateOrderCollection({
                    orderId: id,
                    scanned_code: qrValue,
                    quantity_collected: Number(quantityInput),
                  }));
                }}
              >
                {isActionLoading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.modalBtnConfirmText}>Valider</Text>
                )}
              </TouchableOpacity>
            </View>

          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    paddingTop: 54,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    width: 36, height: 36,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111' },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },

  // Status badge
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 30,
    marginBottom: 20,
    gap: 8,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: 14, fontWeight: '600' },

  // Sections
  section: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 14,
  },

  // Icon box (remplace les emojis)
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Product
  productRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  productName: { fontSize: 17, fontWeight: '700', color: '#111', marginBottom: 4 },
  productMeta: { fontSize: 14, color: '#6B7280' },

  // Finance
  financeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  financeLabel: { fontSize: 15, color: '#374151' },
  financeValue: { fontSize: 15, fontWeight: '600', color: '#111' },
  dividerDashed: {
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
    borderStyle: 'dashed',
  },

  // Info rows
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoMain: { fontSize: 15, fontWeight: '600', color: '#111', marginBottom: 2 },
  infoSub: { fontSize: 13, color: '#6B7280' },

  // Empty transporter → Searching state chic
  searchingContainer: {
    alignItems: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  searchingIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  searchingTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  searchingText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 2,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#6B7280',
  },
  searchingSubText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },

  // QR Code
  qrInstruction: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 19,
  },
  qrCard: {
    alignSelf: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  qrCode: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 3,
    marginTop: 14,
  },

  // Meta
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  metaLabel: { fontSize: 14, color: '#6B7280' },
  metaValue: { fontSize: 14, fontWeight: '500', color: '#374151' },

  // CTA
  ctaContainer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  ctaButton: {
    backgroundColor: '#1D4ED8',
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaText: { fontSize: 16, fontWeight: '700', color: '#FFF' },

  // Error
  errorText: { fontSize: 15, color: '#EF4444', textAlign: 'center', marginBottom: 16 },
  retryBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: { color: '#FFF', fontWeight: '600' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40, height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14, color: '#6B7280', lineHeight: 20, marginBottom: 24,
  },
  inputWrapper: { marginBottom: 24 },
  inputLabel: {
    fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111',
  },
  modalBtnRow: { flexDirection: 'row', gap: 12 },
  modalBtnCancel: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    height: 52,
    justifyContent: 'center', alignItems: 'center',
  },
  modalBtnCancelText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  modalBtnConfirm: {
    flex: 1,
    backgroundColor: '#1D4ED8',
    borderRadius: 14,
    height: 52,
    justifyContent: 'center', alignItems: 'center',
  },
  modalBtnConfirmText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});