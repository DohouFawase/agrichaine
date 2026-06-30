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
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import {
  fetchOrderDetails,
  validateOrderCollection,
  reportDispute,
} from '@/providers/orders/ordersProviderAction';
import { clearCurrentOrder, clearOrderStrings } from '@/slice/orderSlice';
import QRCode from 'react-native-qrcode-svg';
import { ArrowLeft, Package, User, Truck, ShieldAlert, CheckCircle } from 'lucide-react-native';
import { LitigeBottomSheet } from '@/components/LitigeBottomSheet';

const { width } = Dimensions.get('window');
const QR_SIZE = width * 0.58;

// ─── Configuration des Statuts ───────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  paid_searching_driver: { label: 'En attente de collecte',   color: '#2563EB', bg: '#EFF6FF', dot: '#93C5FD' },
  assigned_to_driver:   { label: 'Chauffeur assigné',         color: '#D97706', bg: '#FFFBEB', dot: '#FCD34D' },
  collected:            { label: 'En cours de transport',      color: '#D97706', bg: '#FFFBEB', dot: '#FCD34D' },
  delivered:            { label: 'Vendu & Livré',              color: '#059669', bg: '#ECFDF5', dot: '#6EE7B7' },
  disputed:             { label: 'Litige déclaré',             color: '#EF4444', bg: '#FEF2F2', dot: '#FCA5A5' },
};

const getStatus    = (s: string) => STATUS_CONFIG[s] ?? { label: s, color: '#6B7280', bg: '#F9FAFB', dot: '#D1D5DB' };
const formatPrice  = (amount: number, currency = 'FCFA') => `${amount.toLocaleString('fr-FR')} ${currency}`;

// ─── Animation recherche chauffeur ──────────────────────────────────────────
function SearchingDriver() {
  const truckX = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(truckX, { toValue: 10,  duration: 500, useNativeDriver: true }),
        Animated.timing(truckX, { toValue: -10, duration: 500, useNativeDriver: true }),
        Animated.timing(truckX, { toValue: 0,   duration: 250, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.searchingContainer}>
      <Animated.View style={[styles.searchingIconBox, { transform: [{ translateX: truckX }] }]}>
        <Truck size={22} color="#6B7280" />
      </Animated.View>
      <Text style={styles.searchingText}>Recherche de transporteur active...</Text>
    </View>
  );
}

// ─── Composant Principal ─────────────────────────────────────────────────────
export default function OrderDetailScreen() {
  const { id }   = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();

  const { user }                                                              = useAppSelector((s) => s.auth);
  const userRole                                                              = user?.role;
  const { currentOrder: order, isLoading, isActionLoading, error, successMessage } = useAppSelector((s) => s.orders);

  const pulse = useRef(new Animated.Value(1)).current;

  // ── États locaux ────────────────────────────────────────────────────────────
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [quantityInput,    setQuantityInput]    = useState('');

  const [litigeSheet, setLitigeSheet] = useState<{
    visible: boolean;
    orderId: string;
    reason:  string;
  } | null>(null);

  // ── Chargement initial ──────────────────────────────────────────────────────
  useEffect(() => {
    if (id) dispatch(fetchOrderDetails(id));
    return () => { dispatch(clearCurrentOrder()); };
  }, [id]);

  // ── Réaction au succès d'une action ────────────────────────────────────────
  useEffect(() => {
    if (successMessage) {
      Keyboard.dismiss();
      setShowCollectModal(false);
      setQuantityInput('');
      Alert.alert('Succès', successMessage, [{
        text: 'OK',
        onPress: () => {
          dispatch(clearOrderStrings());
          if (id) dispatch(fetchOrderDetails(id));
        },
      }]);
    }
  }, [successMessage]);

  // ── Animation pulse du badge statut ────────────────────────────────────────
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.4, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,   duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // ── Calculs financiers ──────────────────────────────────────────────────────
  const quantityOrdered  = order?.quantity_ordered       || 0;
  const pricePerUnit     = order?.product?.price_per_unit || 0;
  const itemsTotalPrice  = quantityOrdered * pricePerUnit;
  const deliveryFees     = order?.delivery_fees           || 0;
  const globalTotal      = order?.total_price             || (itemsTotalPrice + deliveryFees);

  const qrValue          = order?.verification_code_collection ?? order?.id ?? '';

  // ── Handler envoi litige ────────────────────────────────────────────────────
  const handleSubmitLitige = async (response: string, photo: string | null) => {
    if (!litigeSheet?.orderId) return;

    let photoFile: File | null = null;
    if (photo) {
      try {
        const res  = await fetch(photo);
        const blob = await res.blob();
        photoFile  = new File([blob], 'proof.jpg', { type: 'image/jpeg' });
      } catch {
        Alert.alert('Erreur', 'Impossible de lire la photo sélectionnée.');
        return;
      }
    }

    const result = await dispatch(
      reportDispute({
        orderId:     litigeSheet.orderId,
        reason:      response,
        proof_photo: photoFile!,
      })
    );

    if (reportDispute.fulfilled.match(result)) {
      setLitigeSheet(null);
      Alert.alert(
        'Litige envoyé',
        'Votre litige a bien été transmis. Un administrateur va examiner votre dossier.',
        [{ text: 'OK', onPress: () => id && dispatch(fetchOrderDetails(id)) }]
      );
    } else {
      Alert.alert('Erreur', (result.payload as string) ?? 'Impossible d\'envoyer le litige.');
    }
  };

  // ── Handler validation collecte (clavier fermé avant envoi) ────────────────
  const handleValidateCollection = () => {
    if (!quantityInput || Number(quantityInput) <= 0) {
      Alert.alert('Quantité invalide', 'Saisissez la quantité réellement collectée.');
      return;
    }
    Keyboard.dismiss();
    dispatch(validateOrderCollection({
      orderId:            id!,
      scanned_code:       qrValue,
      quantity_collected: Number(quantityInput),
    }));
  };

  const handleCloseCollectModal = () => {
    Keyboard.dismiss();
    setShowCollectModal(false);
  };

  // ── Écrans d'état ───────────────────────────────────────────────────────────
  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>;
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

  const status       = getStatus(order.status);
  const isWaitingPickup = order.status === 'paid_searching_driver';
  const isAssigned      = order.status === 'assigned_to_driver';
  const isCollected     = order.status === 'collected';

  // ── Rendu ───────────────────────────────────────────────────────────────────
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

        {/* ── Badge Statut ── */}
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Animated.View style={[styles.statusDot, { backgroundColor: status.dot, transform: [{ scale: pulse }] }]} />
          <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
        </View>

        {/* ── Produit ── */}
        <View style={styles.section}>
          <View style={styles.productRow}>
            <View style={[styles.iconBox, { backgroundColor: '#EBF4E0' }]}>
              <Package size={24} color="#1D9E75" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.productName}>{order.product?.name}</Text>
              <Text style={styles.productMeta}>
                Quantité commandée : {quantityOrdered} {order.product?.unit}
              </Text>
              <Text style={[styles.productMeta, { color: '#059669', fontWeight: '500', marginTop: 2 }]}>
                Stock global restant : {order.product?.quantity ?? 0} {order.product?.unit}
              </Text>
              <Text style={[styles.productMeta, { fontSize: 13, marginTop: 2 }]}>
                📍 {order.product?.location}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Résumé financier ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Résumé financier</Text>

          {userRole === 'buyer' && (
            <>
              <View style={styles.financeRow}>
                <Text style={styles.financeLabel}>Montant articles ({quantityOrdered} {order.product?.unit})</Text>
                <Text style={styles.financeValue}>{formatPrice(itemsTotalPrice)}</Text>
              </View>
              <View style={styles.financeRow}>
                <Text style={styles.financeLabel}>Frais de livraison</Text>
                <Text style={styles.financeValue}>{formatPrice(deliveryFees)}</Text>
              </View>
              <View style={styles.dividerDashed} />
              <View style={styles.financeRow}>
                <Text style={[styles.financeLabel, { fontWeight: '700' }]}>Total Payé (Séquestre)</Text>
                <Text style={[styles.financeValue, { color: '#2563EB', fontWeight: '700' }]}>
                  {formatPrice(globalTotal)}
                </Text>
              </View>
            </>
          )}

          {userRole === 'producer' && (
            <>
              <View style={styles.financeRow}>
                <Text style={styles.financeLabel}>Prix total articles vendus</Text>
                <Text style={styles.financeValue}>{formatPrice(itemsTotalPrice)}</Text>
              </View>
              <View style={styles.financeRow}>
                <Text style={styles.financeLabel}>Prix unitaire</Text>
                <Text style={styles.financeValue}>{formatPrice(pricePerUnit)} / {order.product?.unit}</Text>
              </View>
              <View style={styles.dividerDashed} />
              <View style={styles.financeRow}>
                <Text style={[styles.financeLabel, { fontWeight: '700' }]}>Votre gain net attendu</Text>
                <Text style={[styles.financeValue, { color: '#059669', fontWeight: '700', fontSize: 17 }]}>
                  {formatPrice(itemsTotalPrice)}
                </Text>
              </View>
            </>
          )}

          {userRole === 'transporter' && (
            <View style={styles.financeRow}>
              <Text style={[styles.financeLabel, { fontWeight: '700' }]}>Gain de votre course</Text>
              <Text style={[styles.financeValue, { color: '#D97706', fontWeight: '700', fontSize: 17 }]}>
                {formatPrice(deliveryFees)}
              </Text>
            </View>
          )}
        </View>

        {/* ── Acheteur (visible par producteur & transporteur) ── */}
        {userRole !== 'buyer' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Client / Acheteur</Text>
            <View style={styles.infoRow}>
              <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}><User size={20} color="#2563EB" /></View>
              <View>
                <Text style={styles.infoMain}>{order.buyer?.name} {order.buyer?.last_name}</Text>
                <Text style={styles.infoSub}>{order.buyer?.phone}</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Producteur (visible par acheteur & transporteur) ── */}
        {userRole !== 'producer' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Producteur / Provenance</Text>
            <View style={styles.infoRow}>
              <View style={[styles.iconBox, { backgroundColor: '#EBF4E0' }]}><User size={20} color="#1D9E75" /></View>
              <View>
                <Text style={styles.infoMain}>{order.product?.producer?.name} {order.product?.producer?.last_name}</Text>
                <Text style={styles.infoSub}>{order.product?.producer?.phone || 'Numéro non renseigné'}</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Transporteur (visible par acheteur & producteur) ── */}
        {userRole !== 'transporter' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transporteur assigné</Text>
            {order.transporter ? (
              <View style={styles.infoRow}>
                <View style={[styles.iconBox, { backgroundColor: '#FFFBEB' }]}><Truck size={20} color="#D97706" /></View>
                <View>
                  <Text style={styles.infoMain}>{order.transporter.name} {order.transporter.last_name}</Text>
                  <Text style={styles.infoSub}>{order.transporter.phone}</Text>
                </View>
              </View>
            ) : (
              <SearchingDriver />
            )}
          </View>
        )}

        {/* ── QR Code collecte (producteur uniquement) ── */}
        {userRole === 'producer' && isWaitingPickup && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Code de Collecte Sécurisé</Text>
            <Text style={styles.qrInstruction}>
              Présentez ce QR Code au chauffeur lorsqu'il arrive à votre entrepôt pour charger la marchandise.
            </Text>
            <View style={styles.qrCard}>
              <QRCode value={qrValue} size={QR_SIZE} color="#111827" backgroundColor="transparent" />
            </View>
            <Text style={styles.qrCode}>{qrValue.slice(0, 8).toUpperCase()}</Text>
          </View>
        )}

      </ScrollView>

      {/* ── CTA selon rôle & statut ── */}
      <View style={styles.ctaContainer}>

        {/* Acheteur : marchandise collectée → litige ou confirmation réception */}
        {userRole === 'buyer' && isCollected && (
          <View style={styles.modalBtnRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#EF4444' }]}
              onPress={() => setLitigeSheet({ visible: true, orderId: order.id, reason: '' })}
            >
              <ShieldAlert size={18} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.ctaText}>Signaler un Litige</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#059669' }]}
              onPress={() =>
                Alert.alert(
                  'Confirmation',
                  'Confirmez-vous avoir reçu la totalité de la commande conforme ?',
                  [
                    { text: 'Annuler', style: 'cancel' },
                    { text: 'Oui, Livré', onPress: () => { /* dispatch confirmDelivery */ } },
                  ]
                )
              }
            >
              <CheckCircle size={18} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.ctaText}>Confirmer Réception</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Transporteur : valider la collecte */}
        {userRole === 'transporter' && isAssigned && (
          <TouchableOpacity
            style={[styles.ctaButton, { backgroundColor: '#D97706' }]}
            onPress={() => setShowCollectModal(true)}
          >
            <Text style={styles.ctaText}>Scanner / Valider la collecte</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Modal collecte chauffeur ── */}
      {/* 🔧 CORRECTION CLAVIER :
          1. KeyboardAvoidingView pousse la feuille au-dessus du clavier (iOS: padding, Android: height)
          2. TouchableWithoutFeedback ferme le clavier quand on tape en dehors du champ
          3. Keyboard.dismiss() est appelé explicitement avant l'envoi et à la fermeture,
             pour ne jamais laisser le clavier "figé" après validation. */}
      <Modal
        visible={showCollectModal}
        transparent
        animationType="slide"
        onRequestClose={handleCloseCollectModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Enregistrer le chargement</Text>
              <Text style={styles.modalSubtitle}>
                Saisissez la quantité exacte pesée et chargée chez le producteur.
              </Text>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>
                  Quantité collectée ({order?.product?.unit})
                </Text>
                <TextInput
                  style={styles.input}
                  value={quantityInput}
                  onChangeText={setQuantityInput}
                  keyboardType="numeric"
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                  blurOnSubmit
                  placeholder={`Max. ${order?.quantity_ordered}`}
                />
              </View>

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.modalBtnCancel}
                  onPress={handleCloseCollectModal}
                >
                  <Text style={styles.modalBtnCancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtnConfirm, { backgroundColor: '#D97706' }]}
                  disabled={isActionLoading}
                  onPress={handleValidateCollection}
                >
                  {isActionLoading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.modalBtnConfirmText}>Valider le Chargement</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Litige Bottom Sheet ── */}
      <LitigeBottomSheet
        visible={!!litigeSheet?.visible}
        disputeReason={litigeSheet?.reason ?? ''}
        loading={isActionLoading}
        onClose={() => setLitigeSheet(null)}
        onSubmit={handleSubmitLitige}
      />

    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:               { flex: 1, backgroundColor: '#F9FAFB' },
  center:             { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  header:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', paddingTop: 54, paddingBottom: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backBtn:            { width: 36, height: 36, backgroundColor: '#F3F4F6', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  headerTitle:        { fontSize: 17, fontWeight: '700', color: '#111' },
  scroll:             { flex: 1 },
  scrollContent:      { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120 },
  statusBadge:        { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 30, marginBottom: 20, gap: 8 },
  statusDot:          { width: 8, height: 8, borderRadius: 4 },
  statusLabel:        { fontSize: 14, fontWeight: '600' },
  section:            { backgroundColor: '#FFF', borderRadius: 16, padding: 18, marginBottom: 14, elevation: 1 },
  sectionTitle:       { fontSize: 12, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 },
  iconBox:            { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  productRow:         { flexDirection: 'row', alignItems: 'center', gap: 14 },
  productName:        { fontSize: 17, fontWeight: '700', color: '#111', marginBottom: 4 },
  productMeta:        { fontSize: 14, color: '#6B7280' },
  financeRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  financeLabel:       { fontSize: 15, color: '#374151' },
  financeValue:       { fontSize: 15, fontWeight: '600', color: '#111' },
  dividerDashed:      { borderBottomWidth: 1, borderColor: '#F3F4F6', borderStyle: 'dashed', marginVertical: 4 },
  infoRow:            { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoMain:           { fontSize: 15, fontWeight: '600', color: '#111', marginBottom: 2 },
  infoSub:            { fontSize: 13, color: '#6B7280' },
  searchingContainer: { alignItems: 'center', paddingVertical: 10 },
  searchingIconBox:   { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  searchingText:      { fontSize: 13, color: '#9CA3AF', fontWeight: '500' },
  qrInstruction:      { fontSize: 13, color: '#6B7280', marginBottom: 20, lineHeight: 19 },
  qrCard:             { alignSelf: 'center', backgroundColor: '#F9FAFB', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#E5E7EB' },
  qrCode:             { textAlign: 'center', fontSize: 13, fontWeight: '600', color: '#9CA3AF', letterSpacing: 3, marginTop: 14 },
  ctaContainer:       { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 34, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  ctaButton:          { borderRadius: 16, height: 56, justifyContent: 'center', alignItems: 'center' },
  actionBtn:          { flex: 1, height: 50, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  ctaText:            { fontSize: 15, fontWeight: '700', color: '#FFF' },
  errorText:          { fontSize: 15, color: '#EF4444', textAlign: 'center', marginBottom: 16 },
  retryBtn:           { backgroundColor: '#2563EB', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryText:          { color: '#FFF', fontWeight: '600' },
  modalOverlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  modalSheet:         { backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  modalHandle:        { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle:         { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 8 },
  modalSubtitle:      { fontSize: 14, color: '#6B7280', lineHeight: 20, marginBottom: 24 },
  inputWrapper:       { marginBottom: 24 },
  inputLabel:         { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input:              { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#111' },
  modalBtnRow:        { flexDirection: 'row', gap: 12 },
  modalBtnCancel:     { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 14, height: 52, justifyContent: 'center', alignItems: 'center' },
  modalBtnCancelText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  modalBtnConfirm:    { flex: 1, borderRadius: 14, height: 52, justifyContent: 'center', alignItems: 'center' },
  modalBtnConfirmText:{ fontSize: 15, fontWeight: '700', color: '#FFF' },
});