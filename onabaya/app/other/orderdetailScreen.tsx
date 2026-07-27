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
  validateOrderDelivery,
  reportDispute,
} from '@/providers/orders/ordersProviderAction';
import { clearCurrentOrder, clearOrderStrings } from '@/slice/orderSlice';
import QRCode from 'react-native-qrcode-svg';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import {
  ArrowLeft,
  Package,
  User,
  Truck,
  ShieldAlert,
  CheckCircle2,
  QrCode,
  X,
  ScanLine,
  Clock,
  MapPin,
  CreditCard,
  TrendingUp,
  Phone,
  ChevronRight,
  AlertTriangle,
  Receipt,
  Box,
  Navigation,
} from 'lucide-react-native';
import { LitigeBottomSheet } from '@/components/LitigeBottomSheet';

const { width } = Dimensions.get('window');
const QR_SIZE = width * 0.52;

// ─── Configuration des Statuts ───────────────────────────────────────────────
interface StatusConfig {
  label: string;
  shortLabel: string;
  color: string;
  bg: string;
  dot: string;
  icon: React.ElementType;
  step: number;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  paid_searching_driver: {
    label: 'En attente de collecte',
    shortLabel: 'En attente',
    color: '#8B5CF6',
    bg: '#F5F3FF',
    dot: '#A78BFA',
    icon: Clock,
    step: 1,
  },
  assigned_to_driver: {
    label: 'Chauffeur assigné',
    shortLabel: 'Assigné',
    color: '#E69B00',
    bg: '#FFFBEB',
    dot: '#FCD34D',
    icon: Truck,
    step: 2,
  },
  collected: {
    label: 'En cours de transport',
    shortLabel: 'Transport',
    color: '#3B82F6',
    bg: '#EFF6FF',
    dot: '#93C5FD',
    icon: Navigation,
    step: 3,
  },
  delivered: {
    label: 'Vendu & Livré',
    shortLabel: 'Livré',
    color: '#059669',
    bg: '#ECFDF5',
    dot: '#6EE7B7',
    icon: CheckCircle2,
    step: 4,
  },
  disputed: {
    label: 'Litige déclaré',
    shortLabel: 'Litige',
    color: '#EF4444',
    bg: '#FEF2F2',
    dot: '#FCA5A5',
    icon: AlertTriangle,
    step: 4,
  },
};

const getStatus = (s: string): StatusConfig => STATUS_CONFIG[s] ?? {
  label: s, shortLabel: s, color: '#6B7280', bg: '#F9FAFB', dot: '#D1D5DB', icon: Box, step: 1
};

const formatPrice = (amount: number, currency = 'FCFA') =>
  `${amount.toLocaleString('fr-FR')} ${currency}`;

// ─── Timeline Verticale ─────────────────────────────────────────────────────
function OrderTimeline({ currentStatus }: { currentStatus: string }) {
  const steps = [
    { key: 'paid_searching_driver', label: 'Payé', desc: 'Commande confirmée' },
    { key: 'assigned_to_driver',    label: 'Assigné', desc: 'Chauffeur trouvé' },
    { key: 'collected',             label: 'Transport', desc: 'En route vers vous' },
    { key: 'delivered',             label: 'Livré', desc: 'Commande reçue' },
  ];

  const currentStep = getStatus(currentStatus).step;

  return (
    <View style={timelineStyles.container}>
      {steps.map((step, idx) => {
        const stepNum = idx + 1;
        const isActive = stepNum <= currentStep;
        const isCurrent = stepNum === currentStep;
        const StepIcon = STATUS_CONFIG[step.key]?.icon || Box;

        return (
          <View key={step.key} style={timelineStyles.row}>
            {/* Colonne gauche : ligne + dot */}
            <View style={timelineStyles.leftCol}>
              <View style={[
                timelineStyles.dot,
                isActive && timelineStyles.dotActive,
                isCurrent && timelineStyles.dotCurrent,
              ]}>
                <StepIcon
                  size={isCurrent ? 14 : 12}
                  color={isActive ? '#FFF' : '#CBD5E1'}
                  strokeWidth={2.5}
                />
              </View>
              {idx < steps.length - 1 && (
                <View style={[
                  timelineStyles.line,
                  stepNum < currentStep && timelineStyles.lineActive
                ]} />
              )}
            </View>

            {/* Colonne droite : texte */}
            <View style={[
              timelineStyles.rightCol,
              isCurrent && timelineStyles.rightColCurrent
            ]}>
              <Text style={[
                timelineStyles.stepLabel,
                isActive && timelineStyles.stepLabelActive,
                isCurrent && timelineStyles.stepLabelCurrent,
              ]}>
                {step.label}
              </Text>
              <Text style={[
                timelineStyles.stepDesc,
                isActive && timelineStyles.stepDescActive,
              ]}>
                {isCurrent ? getStatus(currentStatus).label : step.desc}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ─── Section Card Réutilisable ────────────────────────────────────────────────
function SectionCard({
  title,
  icon: Icon,
  iconColor,
  iconBg,
  children,
  rightElement,
}: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  children: React.ReactNode;
  rightElement?: React.ReactNode;
}) {
  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.header}>
        <View style={[cardStyles.iconBox, { backgroundColor: iconBg }]}>
          <Icon size={18} color={iconColor} strokeWidth={2.5} />
        </View>
        <Text style={cardStyles.title}>{title}</Text>
        {rightElement}
      </View>
      <View style={cardStyles.body}>{children}</View>
    </View>
  );
}

// ─── Info Row ───────────────────────────────────────────────────────────────
function InfoRow({
  icon: Icon,
  iconColor,
  iconBg,
  main,
  sub,
}: {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  main: string;
  sub?: string;
}) {
  return (
    <View style={infoStyles.row}>
      <View style={[infoStyles.iconBox, { backgroundColor: iconBg }]}>
        <Icon size={18} color={iconColor} strokeWidth={2} />
      </View>
      <View style={infoStyles.textBox}>
        <Text style={infoStyles.main} numberOfLines={1}>{main}</Text>
        {sub && <Text style={infoStyles.sub}>{sub}</Text>}
      </View>
    </View>
  );
}

// ─── Finance Row ────────────────────────────────────────────────────────────
function FinanceRow({
  label,
  value,
  isTotal,
  valueColor,
}: {
  label: string;
  value: string;
  isTotal?: boolean;
  valueColor?: string;
}) {
  return (
    <View style={financeStyles.row}>
      <Text style={[financeStyles.label, isTotal && financeStyles.labelBold]}>
        {label}
      </Text>
      <Text style={[
        financeStyles.value,
        isTotal && financeStyles.valueBold,
        valueColor && { color: valueColor }
      ]}>
        {value}
      </Text>
    </View>
  );
}

// ─── Composant Principal ─────────────────────────────────────────────────────
export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();

  const { user } = useAppSelector((s) => s.auth);
  const userRole = user?.role;
  const { currentOrder: order, isLoading, isActionLoading, error, successMessage } = useAppSelector((s) => s.orders);

  const pulse = useRef(new Animated.Value(1)).current;

  // ── États locaux ────────────────────────────────────────────────────────────
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [scanMode, setScanMode] = useState<'collection' | 'delivery'>('collection');
  const [collectStep, setCollectStep] = useState<'scan' | 'quantity'>('scan');
  const [quantityInput, setQuantityInput] = useState('');
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [hasScannedOnce, setHasScannedOnce] = useState(false);

  const [permission, requestPermission] = useCameraPermissions();

  const [litigeSheet, setLitigeSheet] = useState<{
    visible: boolean;
    orderId: string;
    reason: string;
  } | null>(null);

  // ── Chargement initial ──────────────────────────────────────────────────────
  useEffect(() => {
    if (id) dispatch(fetchOrderDetails(id));
    return () => { dispatch(clearCurrentOrder()); };
  }, [id]);

  // ── Réaction au succès ─────────────────────────────────────────────────────
  useEffect(() => {
    if (successMessage) {
      Keyboard.dismiss();
      resetCollectModal();
      Alert.alert('Succès', successMessage, [{
        text: 'OK',
        onPress: () => {
          dispatch(clearOrderStrings());
          if (id) dispatch(fetchOrderDetails(id));
        },
      }]);
    }
  }, [successMessage]);

  // ── Animation pulse ────────────────────────────────────────────────────────
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.3, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // ── Calculs financiers ─────────────────────────────────────────────────────
  const quantityOrdered = order?.quantity_ordered || 0;
  const pricePerUnit = order?.product?.price_per_unit || 0;
  const itemsTotalPrice = quantityOrdered * pricePerUnit;
  const deliveryFees = order?.delivery_fees || 0;
  const globalTotal = order?.total_price || (itemsTotalPrice + deliveryFees);

  const collectionQrValue = order?.verification_code_collection ?? order?.id ?? '';
  const deliveryQrValue = order?.verification_code_delivery ?? order?.id ?? '';

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSubmitLitige = async (response: string, photo: string | null) => {
    if (!litigeSheet?.orderId) return;

    let photoFile: File | null = null;
    if (photo) {
      try {
        const res = await fetch(photo);
        const blob = await res.blob();
        photoFile = new File([blob], 'proof.jpg', { type: 'image/jpeg' });
      } catch {
        Alert.alert('Erreur', 'Impossible de lire la photo sélectionnée.');
        return;
      }
    }

    const result = await dispatch(
      reportDispute({
        orderId: litigeSheet.orderId,
        reason: response,
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

  const openCollectModal = async (mode: 'collection' | 'delivery') => {
    setScanMode(mode);
    setCollectStep('scan');
    setScannedCode(null);
    setScanError(null);
    setHasScannedOnce(false);
    setQuantityInput('');

    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert(
          'Caméra requise',
          mode === 'collection'
            ? 'L\'accès à la caméra est nécessaire pour scanner le QR Code du producteur.'
            : 'L\'accès à la caméra est nécessaire pour scanner le QR Code du transporteur.'
        );
        return;
      }
    }
    setShowCollectModal(true);
  };

  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (hasScannedOnce) return;
    setHasScannedOnce(true);

    const data = result.data?.trim();
    if (!data) {
      setScanError('QR Code illisible. Réessayez.');
      setHasScannedOnce(false);
      return;
    }

    setScannedCode(data);
    setScanError(null);
    setCollectStep('quantity');
  };

  const handleRetryScan = () => {
    setScannedCode(null);
    setScanError(null);
    setHasScannedOnce(false);
    setCollectStep('scan');
  };

  const handleValidateCollection = () => {
    if (!scannedCode) {
      Alert.alert(
        'Scan requis',
        scanMode === 'collection'
          ? 'Vous devez scanner le QR Code du producteur avant de valider.'
          : 'Vous devez scanner le QR Code du transporteur avant de valider.'
      );
      setCollectStep('scan');
      return;
    }

    Keyboard.dismiss();

    if (scanMode === 'collection') {
      if (!quantityInput || Number(quantityInput) <= 0) {
        Alert.alert('Quantité invalide', 'Saisissez la quantité réellement collectée.');
        return;
      }
      dispatch(validateOrderCollection({
        orderId: id!,
        scanned_code: scannedCode,
        quantity_collected: Number(quantityInput),
      }));
    } else {
      dispatch(validateOrderDelivery({
        orderId: id!,
        scanned_code: scannedCode,
      }));
    }
  };

  const resetCollectModal = () => {
    Keyboard.dismiss();
    setShowCollectModal(false);
    setCollectStep('scan');
    setScannedCode(null);
    setScanError(null);
    setHasScannedOnce(false);
    setQuantityInput('');
  };

  // ── Écrans d'état ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1D9E75" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.center}>
        <AlertTriangle size={48} color="#EF4444" strokeWidth={1.5} />
        <Text style={styles.errorText}>{error ?? 'Commande introuvable.'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => id && dispatch(fetchOrderDetails(id))}>
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const status = getStatus(order.status);
  const isWaitingPickup = order.status === 'paid_searching_driver';
  const isAssigned = order.status === 'assigned_to_driver';
  const isCollected = order.status === 'collected';

  // ── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>

      {/* ── Header Flottant ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Commande</Text>
          <Text style={styles.headerId}>#{order.id.slice(-6).toUpperCase()}</Text>
        </View>
        <View style={[styles.statusMiniBadge, { backgroundColor: status.bg }]}>
          <Animated.View style={[styles.statusMiniDot, { backgroundColor: status.dot, transform: [{ scale: pulse }] }]} />
          <Text style={[styles.statusMiniText, { color: status.color }]}>{status.shortLabel}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Timeline de Progression ── */}
        <SectionCard
          title="Suivi de commande"
          icon={Navigation}
          iconColor={status.color}
          iconBg={status.bg}
          rightElement={
            <View style={[styles.stepBadge, { backgroundColor: status.bg }]}>
              <Text style={[styles.stepBadgeText, { color: status.color }]}>
                Étape {status.step}/4
              </Text>
            </View>
          }
        >
          <OrderTimeline currentStatus={order.status} />
        </SectionCard>

        {/* ── Produit ── */}
        <SectionCard
          title="Détail du produit"
          icon={Package}
          iconColor="#1D9E75"
          iconBg="#EBF4E0"
        >
          <View style={styles.productRow}>
            <View style={[styles.productImageBox, { backgroundColor: '#F0FDF4' }]}>
              <Package size={28} color="#1D9E75" />
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{order.product?.name}</Text>
              <Text style={styles.productMeta}>
                {quantityOrdered} {order.product?.unit} commandés
              </Text>
              <View style={styles.productTags}>
                <View style={styles.tag}>
                  <MapPin size={12} color="#64748B" />
                  <Text style={styles.tagText}>{order.product?.location}</Text>
                </View>
                <View style={styles.tag}>
                  <Box size={12} color="#64748B" />
                  <Text style={styles.tagText}>Stock: {order.product?.quantity ?? 0} {order.product?.unit}</Text>
                </View>
              </View>
            </View>
          </View>
        </SectionCard>

        {/* ── Résumé financier ── */}
        <SectionCard
          title="Récapitulatif financier"
          icon={Receipt}
          iconColor="#2563EB"
          iconBg="#EFF6FF"
        >
          {userRole === 'buyer' && (
            <>
              <FinanceRow
                label={`Articles (${quantityOrdered} ${order.product?.unit})`}
                value={formatPrice(itemsTotalPrice)}
              />
              <FinanceRow
                label="Frais de livraison"
                value={formatPrice(deliveryFees)}
              />
              <View style={styles.divider} />
              <FinanceRow
                label="Total payé (séquestre)"
                value={formatPrice(globalTotal)}
                isTotal
                valueColor="#2563EB"
              />
            </>
          )}

          {userRole === 'producer' && (
            <>
              <FinanceRow
                label="Prix unitaire"
                value={`${formatPrice(pricePerUnit)} / ${order.product?.unit}`}
              />
              <FinanceRow
                label="Total articles vendus"
                value={formatPrice(itemsTotalPrice)}
              />
              <View style={styles.divider} />
              <FinanceRow
                label="Votre gain net"
                value={formatPrice(itemsTotalPrice)}
                isTotal
                valueColor="#059669"
              />
            </>
          )}

          {userRole === 'transporter' && (
            <FinanceRow
              label="Gain de la course"
              value={formatPrice(deliveryFees)}
              isTotal
              valueColor="#D97706"
            />
          )}
        </SectionCard>

        {/* ── Acheteur ── */}
        {userRole !== 'buyer' && (
          <SectionCard
            title="Client"
            icon={User}
            iconColor="#2563EB"
            iconBg="#EFF6FF"
          >
            <InfoRow
              icon={User}
              iconColor="#2563EB"
              iconBg="#EFF6FF"
              main={`${order.buyer?.name} ${order.buyer?.last_name}`}
              sub={order.buyer?.phone}
            />
          </SectionCard>
        )}

        {/* ── Producteur ── */}
        {userRole !== 'producer' && (
          <SectionCard
            title="Producteur"
            icon={TrendingUp}
            iconColor="#1D9E75"
            iconBg="#EBF4E0"
          >
            <InfoRow
              icon={User}
              iconColor="#1D9E75"
              iconBg="#EBF4E0"
              main={`${order.product?.producer?.name} ${order.product?.producer?.last_name}`}
              sub={order.product?.producer?.phone || 'Numéro non renseigné'}
            />
          </SectionCard>
        )}

        {/* ── Transporteur ── */}
        {userRole !== 'transporter' && (
          <SectionCard
            title="Transporteur"
            icon={Truck}
            iconColor="#E69B00"
            iconBg="#FFFBEB"
          >
            {order.transporter ? (
              <InfoRow
                icon={Truck}
                iconColor="#E69B00"
                iconBg="#FFFBEB"
                main={`${order.transporter.name} ${order.transporter.last_name}`}
                sub={order.transporter.phone}
              />
            ) : (
              <View style={styles.searchingBox}>
                <View style={styles.searchingIconWrap}>
                  <Truck size={20} color="#9CA3AF" />
                </View>
                <View>
                  <Text style={styles.searchingTitle}>Recherche en cours...</Text>
                  <Text style={styles.searchingSub}>Un chauffeur sera bientôt assigné</Text>
                </View>
              </View>
            )}
          </SectionCard>
        )}

        {/* ── QR Code Collecte (Producteur) ── */}
        {userRole === 'producer' && isAssigned && (
          <SectionCard
            title="Code de collecte"
            icon={QrCode}
            iconColor="#7C3AED"
            iconBg="#F5F3FF"
          >
            <Text style={styles.qrDesc}>
              Présentez ce QR Code au chauffeur lors du chargement de la marchandise.
            </Text>
            <View style={styles.qrWrap}>
              <View style={styles.qrCard}>
                <QRCode value={collectionQrValue} size={QR_SIZE} color="#111827" backgroundColor="transparent" />
              </View>
              <Text style={styles.qrCodeText}>{collectionQrValue.slice(0, 8).toUpperCase()}</Text>
            </View>
          </SectionCard>
        )}

        {/* ── En attente (Producteur) ── */}
        {userRole === 'producer' && isWaitingPickup && (
          <SectionCard
            title="Statut"
            icon={Clock}
            iconColor="#8B5CF6"
            iconBg="#F5F3FF"
          >
            <View style={styles.searchingBox}>
              <View style={[styles.searchingIconWrap, { backgroundColor: '#F5F3FF' }]}>
                <Clock size={20} color="#8B5CF6" />
              </View>
              <View>
                <Text style={styles.searchingTitle}>En attente de chauffeur</Text>
                <Text style={styles.searchingSub}>Vous serez notifié dès qu'un transporteur sera disponible</Text>
              </View>
            </View>
          </SectionCard>
        )}

        {/* ── QR Code Livraison (Transporteur) ── */}
        {userRole === 'transporter' && isCollected && (
          <SectionCard
            title="Code de livraison"
            icon={QrCode}
            iconColor="#7C3AED"
            iconBg="#F5F3FF"
          >
            <Text style={styles.qrDesc}>
              Présentez ce QR Code à l'acheteur pour confirmer la livraison.
            </Text>
            <View style={styles.qrWrap}>
              <View style={styles.qrCard}>
                <QRCode value={deliveryQrValue} size={QR_SIZE} color="#111827" backgroundColor="transparent" />
              </View>
              <Text style={styles.qrCodeText}>{deliveryQrValue.slice(0, 8).toUpperCase()}</Text>
            </View>
          </SectionCard>
        )}

        {/* Spacer pour le CTA */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── CTA Bottom ── */}
      <View style={styles.ctaWrapper}>
        <View style={styles.ctaContainer}>
          {userRole === 'buyer' && isCollected && (
            <View style={styles.ctaRow}>
              <TouchableOpacity
                style={[styles.ctaBtn, styles.ctaBtnLitige]}
                onPress={() => setLitigeSheet({ visible: true, orderId: order.id, reason: '' })}
              >
                <ShieldAlert size={18} color="#EF4444" />
                <Text style={styles.ctaBtnLitigeText}>Litige</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.ctaBtn, styles.ctaBtnSuccess]}
                onPress={() => openCollectModal('delivery')}
              >
                <CheckCircle2 size={18} color="#FFF" />
                <Text style={styles.ctaBtnText}>Confirmer réception</Text>
              </TouchableOpacity>
            </View>
          )}

          {userRole === 'transporter' && isAssigned && (
            <TouchableOpacity
              style={[styles.ctaBtn, styles.ctaBtnPrimary]}
              onPress={() => openCollectModal('collection')}
            >
              <ScanLine size={20} color="#FFF" />
              <Text style={styles.ctaBtnText}>Scanner la collecte</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Modal Scan ── */}
      <Modal
        visible={showCollectModal}
        transparent
        animationType="slide"
        onRequestClose={resetCollectModal}
      >
        {collectStep === 'scan' ? (
          <View style={styles.scanOverlay}>
            <View style={styles.scanHeader}>
              <TouchableOpacity onPress={resetCollectModal} hitSlop={12} style={styles.scanCloseBtn}>
                <X size={22} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.scanHeaderTitle}>
                {scanMode === 'collection' ? 'Scanner le QR producteur' : 'Scanner le QR transporteur'}
              </Text>
              <View style={{ width: 36 }} />
            </View>

            {permission?.granted ? (
              <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={hasScannedOnce ? undefined : handleBarcodeScanned}
              />
            ) : (
              <View style={styles.center}>
                <Text style={{ color: '#FFF', textAlign: 'center', paddingHorizontal: 24 }}>
                  Autorisation caméra requise.
                </Text>
                <TouchableOpacity style={[styles.retryBtn, { marginTop: 16 }]} onPress={requestPermission}>
                  <Text style={styles.retryText}>Autoriser</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.scanFrameContainer} pointerEvents="none">
              <View style={styles.scanFrame} />
              <ScanLine size={28} color="#FFF" style={{ marginTop: 16, opacity: 0.85 }} />
              <Text style={styles.scanHint}>
                {scanMode === 'collection'
                  ? 'Alignez le QR Code du producteur'
                  : 'Alignez le QR Code du transporteur'}
              </Text>
            </View>

            {scanError && (
              <View style={styles.scanErrorBanner}>
                <AlertTriangle size={18} color="#FFF" />
                <Text style={styles.scanErrorText}>{scanError}</Text>
                <TouchableOpacity onPress={handleRetryScan}>
                  <Text style={styles.scanRetryText}>Réessayer</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalSheet}>
                <View style={styles.modalHandle} />

                <View style={styles.scanConfirmedRow}>
                  <View style={styles.scanConfirmedIcon}>
                    <QrCode size={18} color="#059669" />
                  </View>
                  <Text style={styles.scanConfirmedText}>QR Code scanné avec succès</Text>
                  <TouchableOpacity onPress={handleRetryScan} hitSlop={8}>
                    <Text style={styles.scanRescanText}>Rescanner</Text>
                  </TouchableOpacity>
                </View>

                {scanMode === 'collection' ? (
                  <>
                    <Text style={styles.modalTitle}>Valider le chargement</Text>
                    <Text style={styles.modalSubtitle}>
                      Saisissez la quantité exacte pesée chez le producteur.
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
                        autoFocus
                        placeholder={`Max. ${order?.quantity_ordered}`}
                        placeholderTextColor="#CBD5E1"
                      />
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={styles.modalTitle}>Confirmer la réception</Text>
                    <Text style={styles.modalSubtitle}>
                      Vous confirmez avoir reçu votre commande. Les fonds seront libérés.
                    </Text>
                  </>
                )}

                <View style={styles.modalBtnRow}>
                  <TouchableOpacity style={styles.modalBtnCancel} onPress={resetCollectModal}>
                    <Text style={styles.modalBtnCancelText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtnConfirm, { backgroundColor: scanMode === 'collection' ? '#D97706' : '#059669' }]}
                    disabled={isActionLoading}
                    onPress={handleValidateCollection}
                  >
                    {isActionLoading ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={styles.modalBtnConfirmText}>
                        {scanMode === 'collection' ? 'Valider' : 'Confirmer'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        )}
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

// ══════════════════════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 40 },
  loadingText: { marginTop: 16, fontSize: 15, color: '#64748B', fontWeight: '500' },
  errorText: { marginTop: 16, fontSize: 16, color: '#64748B', textAlign: 'center', marginBottom: 20, fontWeight: '500', lineHeight: 22 },
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
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 13, color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  headerId: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 2 },
  statusMiniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusMiniDot: { width: 6, height: 6, borderRadius: 3 },
  statusMiniText: { fontSize: 11, fontWeight: '700' },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },

  // Product dans section
  productRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  productImageBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 17, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  productMeta: { fontSize: 14, color: '#64748B', fontWeight: '500', marginBottom: 8 },
  productTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  tagText: { fontSize: 12, color: '#64748B', fontWeight: '500' },

  // Divider
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },

  // Searching
  searchingBox: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  searchingIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchingTitle: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  searchingSub: { fontSize: 13, color: '#94A3B8', marginTop: 2 },

  // QR
  qrDesc: { fontSize: 14, color: '#64748B', lineHeight: 20, marginBottom: 20 },
  qrWrap: { alignItems: 'center' },
  qrCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  qrCodeText: { marginTop: 16, fontSize: 14, fontWeight: '700', color: '#94A3B8', letterSpacing: 3 },

  // CTA
  ctaWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(248,250,252,0.95)',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  ctaContainer: {},
  ctaRow: { flexDirection: 'row', gap: 12 },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 16,
    gap: 8,
  },
  ctaBtnLitige: {
    flex: 0.35,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  ctaBtnLitigeText: { color: '#EF4444', fontWeight: '700', fontSize: 14 },
  ctaBtnSuccess: { flex: 0.65, backgroundColor: '#059669' },
  ctaBtnPrimary: { flex: 1, backgroundColor: '#D97706' },
  ctaBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },

  stepBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  stepBadgeText: { fontSize: 11, fontWeight: '700' },

  // Modal / Scan
  scanOverlay: { flex: 1, backgroundColor: '#000' },
  scanHeader: {
    position: 'absolute',
    top: 54,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  scanCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanHeaderTitle: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  scanFrameContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scanFrame: {
    width: width * 0.65,
    height: width * 0.65,
    borderWidth: 3,
    borderColor: '#FFF',
    borderRadius: 24,
    backgroundColor: 'transparent',
  },
  scanHint: { color: '#FFF', fontSize: 13, marginTop: 16, textAlign: 'center', paddingHorizontal: 40, opacity: 0.9 },
  scanErrorBanner: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
    backgroundColor: '#EF4444',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scanErrorText: { flex: 1, color: '#FFF', fontSize: 14, fontWeight: '600' },
  scanRetryText: { color: '#FFF', fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 6 },
  modalSubtitle: { fontSize: 14, color: '#64748B', lineHeight: 20, marginBottom: 24 },
  inputWrapper: { marginBottom: 24 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '600',
  },
  modalBtnRow: { flexDirection: 'row', gap: 12 },
  modalBtnCancel: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 14, height: 54, justifyContent: 'center', alignItems: 'center' },
  modalBtnCancelText: { fontSize: 15, fontWeight: '700', color: '#64748B' },
  modalBtnConfirm: { flex: 1, borderRadius: 14, height: 54, justifyContent: 'center', alignItems: 'center' },
  modalBtnConfirmText: { fontSize: 15, fontWeight: '700', color: '#FFF' },

  scanConfirmedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    gap: 10,
  },
  scanConfirmedIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanConfirmedText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#059669' },
  scanRescanText: { fontSize: 13, fontWeight: '700', color: '#2563EB' },
});

// ─── Section Card Styles ─────────────────────────────────────────────────────
const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  body: { padding: 18, paddingTop: 14 },
});

// ─── Timeline Styles ─────────────────────────────────────────────────────────
const timelineStyles = StyleSheet.create({
  container: { paddingVertical: 4 },
  row: { flexDirection: 'row' },
  leftCol: { alignItems: 'center', width: 32, marginRight: 14 },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  dotActive: { backgroundColor: '#1D9E75', borderColor: '#1D9E75' },
  dotCurrent: {
    backgroundColor: '#1D9E75',
    borderColor: '#1D9E75',
    shadowColor: '#1D9E75',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  line: { width: 2, flex: 1, backgroundColor: '#E2E8F0', marginVertical: 4 },
  lineActive: { backgroundColor: '#1D9E75' },
  rightCol: { flex: 1, paddingBottom: 24, justifyContent: 'center' },
  rightColCurrent: {},
  stepLabel: { fontSize: 14, fontWeight: '600', color: '#94A3B8', marginBottom: 2 },
  stepLabelActive: { color: '#0F172A' },
  stepLabelCurrent: { color: '#0F172A', fontWeight: '700' },
  stepDesc: { fontSize: 13, color: '#CBD5E1' },
  stepDescActive: { color: '#64748B' },
});

// ─── Info Row Styles ─────────────────────────────────────────────────────────
const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textBox: { flex: 1 },
  main: { fontSize: 15, fontWeight: '600', color: '#0F172A', marginBottom: 2 },
  sub: { fontSize: 13, color: '#94A3B8' },
});

// ─── Finance Styles ──────────────────────────────────────────────────────────
const financeStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  label: { fontSize: 15, color: '#64748B', fontWeight: '500' },
  labelBold: { fontSize: 16, color: '#0F172A', fontWeight: '700' },
  value: { fontSize: 15, color: '#0F172A', fontWeight: '600' },
  valueBold: { fontSize: 18, fontWeight: '800' },
});