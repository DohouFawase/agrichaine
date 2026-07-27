import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
  Platform,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import {
  Search,
  ShieldCheck,
  Package,
  CheckCircle2,
  AlertTriangle,
  Phone,
  MessageCircle,
  X,
  MapPin,
  Navigation,
  Clock,
  Wallet,
  Star,
  Truck,
  RotateCw,
  ChevronRight,
  User,
  Store,
  ArrowRight,
} from 'lucide-react-native';
import { useMapsTracking } from '@/hooks/usemapsTracking';
import type { ProductLocation } from '@/providers/maps/mapsProviderAction';

// ─────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────
const TOKENS = {
  navy: '#1A3A6B',
  blue: '#185FA5',
  green: '#1D9E75',
  orange: '#D85A30',
  red: '#E24B4A',
  slate: '#64748B',
  stone: '#78716C',
  surface: '#FFFFFF',
  mutedBg: '#F8FAFC',
  border: '#E2E8F0',
  ink: '#0F172A',
  inkMuted: '#64748B',
};

const STATUS_COLOR: Record<string, string> = {
  pending: TOKENS.stone,
  assigned: TOKENS.orange,
  collected: TOKENS.green,
  delivered: TOKENS.blue,
  disputed: TOKENS.red,
};

const STATUS_BG: Record<string, string> = {
  pending: '#F1F5F9',
  assigned: '#FFF7ED',
  collected: '#ECFDF5',
  delivered: '#EFF6FF',
  disputed: '#FEF2F2',
};

// ── Stepper config avec Lucide ─────────────────────────────────────────
const STEPS_CONFIG: Record<
  string,
  { title: string; subtitle: string; icon: React.ElementType }
> = {
  pending: {
    title: 'Commande confirmée',
    subtitle: 'Recherche chauffeur',
    icon: Search,
  },
  assigned: {
    title: 'En approche',
    subtitle: 'Vers le producteur',
    icon: ShieldCheck,
  },
  collected: {
    title: 'Récupéré',
    subtitle: 'En route vers vous',
    icon: Package,
  },
  delivered: {
    title: 'Livré',
    subtitle: 'Commande terminée',
    icon: CheckCircle2,
  },
};

const STEP_ORDER = ['pending', 'assigned', 'collected', 'delivered'];

// ── Timeline narrative events ────────────────────────────────────────
const TIMELINE_EVENTS: Record<
  string,
  { label: (order: any) => string; sublabel: (order: any) => string }
> = {
  pending: {
    label: () => 'Recherche d\u2019un chauffeur',
    sublabel: () => 'On cherche quelqu\u2019un pour ta commande',
  },
  assigned: {
    label: (o) => `${o.driver?.name ?? 'Le chauffeur'} arrive chez le producteur`,
    sublabel: (o) => (o.eta_pickup_label ? `Estimé ${o.eta_pickup_label}` : 'En approche'),
  },
  collected: {
    label: (o) => `${o.driver?.name ?? 'Le chauffeur'} a récupéré ${o.product?.name ?? 'ton produit'}`,
    sublabel: (o) => (o.collected_at_label ? o.collected_at_label : 'En route vers chez toi'),
  },
  delivered: {
    label: () => 'Livré chez toi',
    sublabel: (o) => (o.delivered_at_label ? o.delivered_at_label : 'Commande terminée'),
  },
  disputed: {
    label: () => 'Litige en cours',
    sublabel: () => 'Notre équipe a été notifiée',
  },
};

// ─────────────────────────────────────────────
// ÉCRAN PRINCIPAL
// ─────────────────────────────────────────────

export default function MapsScreen() {
  const mapRef = useRef<MapView>(null);
  const [buyerCoords, setBuyerCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const {
    products,
    productsLoading,
    selectedProduct,
    activeOrder,
    driverCoords,
    producerCoords,
    etaLabel,
    distanceRemainingLabel,
    orderCreating,
    orderCreateError,
    walletBalance,
    walletCurrency,
    onPinPress,
    onCloseBottomSheet,
    onOrderProduct,
    refreshProducts,
  } = useMapsTracking();

  // ── Géolocalisation ──
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (isMounted) setLocationError('Localisation refusée');
          return;
        }
        const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (isMounted) {
          setBuyerCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        }
      } catch {
        if (isMounted) setLocationError('Impossible de récupérer ta position');
      }
    })();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (buyerCoords && !activeOrder) {
      mapRef.current?.animateCamera({ center: buyerCoords, zoom: 13 }, { duration: 500 });
    }
  }, [buyerCoords, activeOrder]);

  useEffect(() => {
    if (driverCoords?.latitude && driverCoords?.longitude) {
      mapRef.current?.animateCamera({ center: driverCoords, zoom: 13 }, { duration: 600 });
    }
  }, [driverCoords?.latitude, driverCoords?.longitude]);

  useEffect(() => {
    if (orderCreateError) Alert.alert('Erreur', orderCreateError);
  }, [orderCreateError]);

  useEffect(() => {
    if (activeOrder?.status === 'pending') {
      const center = producerCoords ?? buyerCoords;
      if (center) mapRef.current?.animateCamera({ center, zoom: 14 }, { duration: 500 });
    }
  }, [activeOrder?.status, producerCoords, buyerCoords]);

  // ── Tracés ──
  const isPickupPhase = activeOrder && ['pending', 'assigned'].includes(activeOrder.status);
  const isTransitPhase = activeOrder && ['collected', 'delivered'].includes(activeOrder.status);
  const isSearchingPhase = activeOrder && activeOrder.status === 'pending';
  const radarCenter = producerCoords ?? buyerCoords;

  const remainingCoords: { latitude: number; longitude: number }[] = [];
  const doneCoords: { latitude: number; longitude: number }[] = [];

  if (activeOrder && driverCoords?.latitude) {
    if (isPickupPhase && producerCoords) {
      remainingCoords.push(driverCoords, producerCoords);
    } else if (isTransitPhase) {
      if (producerCoords) doneCoords.push(producerCoords, driverCoords);
      if (activeOrder.buyer_latitude && activeOrder.buyer_longitude) {
        remainingCoords.push(driverCoords, {
          latitude: activeOrder.buyer_latitude,
          longitude: activeOrder.buyer_longitude,
        });
      }
    }
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: buyerCoords?.latitude ?? 6.3654,
          longitude: buyerCoords?.longitude ?? 2.4183,
          latitudeDelta: 0.3,
          longitudeDelta: 0.3,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        {products.map((product) => (
          <Marker
            key={product.id}
            coordinate={{ latitude: product.latitude, longitude: product.longitude }}
            onPress={() => onPinPress(product)}
            pinColor={TOKENS.green}
            title={product.name}
            description={`${product.quantity} ${product.unit} — ${product.price_per_unit} ${walletCurrency}`}
          />
        ))}

        {producerCoords && (
          <Marker coordinate={producerCoords} pinColor={TOKENS.green} title="Producteur" />
        )}

        {isSearchingPhase && radarCenter && (
          <Marker coordinate={radarCenter} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges>
            <RadarSearchPin />
          </Marker>
        )}

        {driverCoords?.latitude && (
          <Marker coordinate={driverCoords} anchor={{ x: 0.5, y: 0.5 }} title="Chauffeur">
            <PulsingDriverPin />
          </Marker>
        )}

        {remainingCoords.length >= 2 && (
          <Polyline coordinates={remainingCoords} strokeColor={TOKENS.blue} strokeWidth={4} lineDashPattern={[10, 6]} />
        )}
        {doneCoords.length >= 2 && (
          <Polyline coordinates={doneCoords} strokeColor={TOKENS.green} strokeWidth={5} />
        )}
      </MapView>

      {/* ── Overlays ── */}
      {productsLoading && (
        <View style={styles.overlayDim}>
          <ActivityIndicator size="large" color={TOKENS.surface} />
        </View>
      )}

      {locationError && !activeOrder && (
        <View style={styles.glassPill}>
          <AlertTriangle size={14} color={TOKENS.orange} />
          <Text style={styles.glassPillText}>{locationError}</Text>
        </View>
      )}

      {distanceRemainingLabel && driverCoords?.latitude && (
        <View style={[styles.glassPill, styles.distancePillPos]}>
          <Navigation size={14} color={TOKENS.blue} />
          <Text style={[styles.glassPillText, { color: TOKENS.ink, fontWeight: '700' }]}>
            {distanceRemainingLabel}
          </Text>
        </View>
      )}

      {!activeOrder && (
        <TouchableOpacity style={styles.fabRefresh} onPress={refreshProducts} activeOpacity={0.85}>
          <RotateCw size={20} color={TOKENS.navy} />
        </TouchableOpacity>
      )}

      {/* ── Bottom Sheets ── */}
      {selectedProduct && !activeOrder && (
        <ProductBottomSheet
          product={selectedProduct}
          walletBalance={walletBalance}
          walletCurrency={walletCurrency}
          loading={orderCreating}
          onClose={onCloseBottomSheet}
          onOrder={(qty, totalPrice, deliveryPrice) =>
            onOrderProduct({
              product_id: selectedProduct.id,
              quantity_ordered: qty,
              total_price: totalPrice,
              delivery_price: deliveryPrice,
            })
          }
        />
      )}

      {activeOrder && (
        <OrderTrackingSheet order={activeOrder} etaLabel={etaLabel} />
      )}
    </View>
  );
}

// ─────────────────────────────────────────────
// PINS ANIMÉS
// ─────────────────────────────────────────────

function PulsingDriverPin() {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] });

  return (
    <View style={styles.driverPinWrap}>
      <Animated.View style={[styles.driverPinHalo, { transform: [{ scale }], opacity }]} />
      <View style={styles.driverPinCore}>
        <Truck size={14} color="#fff" strokeWidth={2.5} />
      </View>
    </View>
  );
}

function RadarSearchPin() {
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const makeLoop = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1, duration: 2000, useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );
    const l1 = makeLoop(ring1, 0), l2 = makeLoop(ring2, 700), l3 = makeLoop(ring3, 1400);
    l1.start(); l2.start(); l3.start();
    return () => { l1.stop(); l2.stop(); l3.stop(); };
  }, []);

  const ringStyle = (val: Animated.Value) => ({
    transform: [{ scale: val.interpolate({ inputRange: [0, 1], outputRange: [0.4, 3.5] }) }],
    opacity: val.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.5, 0.2, 0] }),
  });

  return (
    <View style={styles.radarWrap}>
      <Animated.View style={[styles.radarRing, ringStyle(ring1)]} />
      <Animated.View style={[styles.radarRing, ringStyle(ring2)]} />
      <Animated.View style={[styles.radarRing, ringStyle(ring3)]} />
      <View style={styles.radarCore}>
        <Search size={16} color={TOKENS.orange} strokeWidth={2.5} />
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// PRODUCT BOTTOM SHEET
// ─────────────────────────────────────────────

function ProductBottomSheet({
  product,
  walletBalance,
  walletCurrency,
  loading,
  onClose,
  onOrder,
}: {
  product: ProductLocation;
  walletBalance: number | null;
  walletCurrency: string;
  loading: boolean;
  onClose: () => void;
  onOrder: (qty: number, total: number, delivery: number) => void;
}) {
  const qty = 1;
  const DELIVERY_PRICE = 1500;
  const totalPrice = qty * product.price_per_unit;
  const totalWithDelivery = totalPrice + DELIVERY_PRICE;
  const canAfford = walletBalance !== null && walletBalance >= totalWithDelivery;

  return (
    <View style={styles.sheetContainer}>
      <View style={styles.sheetHandle} />
      
      {/* Header */}
      <View style={styles.sheetHeader}>
        <View style={styles.sheetHeaderLeft}>
          <View style={[styles.categoryBadge, { backgroundColor: TOKENS.green + '15' }]}>
            <Store size={12} color={TOKENS.green} />
            <Text style={[styles.categoryText, { color: TOKENS.green }]}>Produit</Text>
          </View>
          <Text style={styles.sheetTitle} numberOfLines={2}>{product.name}</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={12}>
          <X size={20} color={TOKENS.stone} />
        </TouchableOpacity>
      </View>

      {/* Producteur */}
      <View style={styles.producerRow}>
        <MapPin size={14} color={TOKENS.stone} />
        <Text style={styles.producerText}>
          {product.producer?.name} {product.producer?.last_name}
        </Text>
        {product.producer?.average_rating && (
          <View style={styles.ratingBadge}>
            <Star size={12} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.ratingText}>{product.producer.average_rating}</Text>
          </View>
        )}
      </View>

      {/* Price Grid */}
      <View style={styles.priceGrid}>
        <View style={styles.priceCell}>
          <Text style={styles.priceCellLabel}>Prix unitaire</Text>
          <Text style={styles.priceCellValue}>
            {product.price_per_unit.toLocaleString()} <Text style={styles.currency}>{walletCurrency}</Text>
          </Text>
        </View>
        <View style={[styles.priceCell, styles.priceCellDivider]}>
          <Text style={styles.priceCellLabel}>Livraison</Text>
          <Text style={styles.priceCellValue}>
            {DELIVERY_PRICE.toLocaleString()} <Text style={styles.currency}>{walletCurrency}</Text>
          </Text>
        </View>
        <View style={styles.priceCell}>
          <Text style={styles.priceCellLabel}>Total</Text>
          <Text style={[styles.priceCellValue, { color: TOKENS.navy }]}>
            {totalWithDelivery.toLocaleString()} <Text style={[styles.currency, { color: TOKENS.navy }]}>{walletCurrency}</Text>
          </Text>
        </View>
      </View>

      {/* Balance warning */}
      {walletBalance !== null && !canAfford && (
        <View style={styles.warnRow}>
          <AlertTriangle size={14} color={TOKENS.red} />
          <Text style={styles.warnText}>
            Solde insuffisant · {walletBalance.toLocaleString()} {walletCurrency}
          </Text>
        </View>
      )}

      {/* CTA */}
      <TouchableOpacity
        style={[styles.ctaButton, (!canAfford || loading) && styles.ctaDisabled]}
        onPress={() => onOrder(qty, totalPrice, DELIVERY_PRICE)}
        disabled={!canAfford || loading}
        activeOpacity={0.9}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Wallet size={18} color="#fff" />
            <Text style={styles.ctaText}>Commander — fonds sécurisés</Text>
            <ChevronRight size={18} color="#fff" opacity={0.7} />
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────
// ORDER TRACKING SHEET
// ─────────────────────────────────────────────

function OrderTrackingSheet({
  order,
  etaLabel,
}: {
  order: any;
  etaLabel?: string | null;
}) {
  const currentIdx = STEP_ORDER.indexOf(order.status);
  const isDisputed = order.status === 'disputed';
  const currentEvent = TIMELINE_EVENTS[order.status] ?? TIMELINE_EVENTS.pending;
  const statusColor = STATUS_COLOR[order.status] ?? TOKENS.stone;
  const statusBg = STATUS_BG[order.status] ?? TOKENS.mutedBg;

  const handleCallDriver = () => {
    if (!order.driver?.phone) return;
    const url = Platform.select({ ios: `telprompt:${order.driver.phone}`, default: `tel:${order.driver.phone}` });
    Linking.openURL(url).catch(() => Alert.alert('Erreur', 'Impossible de lancer l\u2019appel'));
  };

  return (
    <View style={styles.sheetContainer}>
      <View style={styles.sheetHandle} />

      {/* ── Header Status ── */}
      <View style={styles.trackHeader}>
        <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
          {isDisputed ? (
            <AlertTriangle size={14} color={TOKENS.red} />
          ) : (
            <Clock size={14} color={statusColor} />
          )}
          <Text style={[styles.statusText, { color: statusColor }]}>
            {isDisputed ? 'Litige' : currentEvent.label(order)}
          </Text>
        </View>
        {etaLabel && !isDisputed && (
          <View style={styles.etaBadge}>
            <Navigation size={12} color={TOKENS.blue} />
            <Text style={styles.etaText}>{etaLabel}</Text>
          </View>
        )}
      </View>
      <Text style={styles.trackSub}>{currentEvent.sublabel(order)}</Text>

      {/* ── Stepper ── */}
      {!isDisputed && (
        <View style={styles.stepper}>
          {STEP_ORDER.map((step, i) => {
            const isPast = i < currentIdx;
            const isCurrent = i === currentIdx;
            const isDone = isPast || isCurrent;
            const stepColor = isDone ? (STATUS_COLOR[step] ?? TOKENS.green) : '#CBD5E1';
            const StepIcon = STEPS_CONFIG[step].icon;

            return (
              <React.Fragment key={step}>
                <View style={styles.stepNode}>
                  <View
                    style={[
                      styles.stepCircle,
                      {
                        backgroundColor: isDone ? stepColor : '#F1F5F9',
                        borderColor: isDone ? stepColor : '#E2E8F0',
                      },
                    ]}
                  >
                    <StepIcon size={16} color={isDone ? '#fff' : '#94A3B8'} strokeWidth={2.5} />
                  </View>
                  <Text style={[styles.stepTitle, isCurrent && { color: TOKENS.ink, fontWeight: '700' }]}>
                    {STEPS_CONFIG[step].title}
                  </Text>
                  <Text style={styles.stepSubtitle}>{STEPS_CONFIG[step].subtitle}</Text>
                </View>
                {i < STEP_ORDER.length - 1 && (
                  <View style={[styles.stepRail, { backgroundColor: isPast ? stepColor : '#E2E8F0' }]} />
                )}
              </React.Fragment>
            );
          })}
        </View>
      )}

      {isDisputed && (
        <View style={[styles.disputeBox, { backgroundColor: STATUS_BG.disputed }]}>
          <AlertTriangle size={20} color={TOKENS.red} />
          <Text style={styles.disputeText}>{TIMELINE_EVENTS.disputed.sublabel(order)}</Text>
        </View>
      )}

      {/* ── Driver Card ── */}
      {order.driver && (
        <View style={styles.driverCard}>
          <View style={styles.driverAvatar}>
            <Text style={styles.driverAvatarText}>
              {order.driver.name?.[0]}{order.driver.last_name?.[0]}
            </Text>
          </View>

          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>
              {order.driver.name} {order.driver.last_name}
            </Text>
            <View style={styles.driverMetaRow}>
              <Truck size={12} color={TOKENS.stone} />
              <Text style={styles.driverMetaText}>
                {order.driver.vehicle_type ?? 'Chauffeur'}
              </Text>
              {order.driver.average_rating && (
                <>
                  <View style={styles.dot} />
                  <Star size={12} color="#F59E0B" fill="#F59E0B" />
                  <Text style={styles.driverMetaText}>{order.driver.average_rating}</Text>
                </>
              )}
            </View>
          </View>

          <View style={styles.driverActions}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: TOKENS.green + '12' }]}
              onPress={handleCallDriver}
              disabled={!order.driver.phone}
            >
              <Phone size={18} color={TOKENS.green} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: TOKENS.blue + '12' }]}>
              <MessageCircle size={18} color={TOKENS.blue} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Product summary ── */}
      <View style={styles.productSummary}>
        <Package size={16} color={TOKENS.stone} />
        <Text style={styles.productSummaryText} numberOfLines={1}>
          {order.product?.name} · {order.product?.quantity} {order.product?.unit}
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────

const { width: W } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  map: { ...StyleSheet.absoluteFillObject },

  // ── Overlays ──
  overlayDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassPill: {
    position: 'absolute',
    top: 52,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  glassPillText: { fontSize: 13, fontWeight: '600', color: TOKENS.inkMuted },
  distancePillPos: { top: '38%' },

  fabRefresh: {
    position: 'absolute',
    bottom: 110,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },

  // ── Pins ──
  driverPinWrap: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  driverPinHalo: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: TOKENS.orange,
  },
  driverPinCore: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: TOKENS.orange,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },

  radarWrap: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  radarRing: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: TOKENS.orange,
    backgroundColor: TOKENS.orange + '20',
  },
  radarCore: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: TOKENS.orange,
    elevation: 4,
  },

  // ── Bottom Sheet Base ──
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: TOKENS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 16,
  },

  // ── Product Sheet ──
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  sheetHeaderLeft: { flex: 1, marginRight: 12 },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  sheetTitle: { fontSize: 22, fontWeight: '800', color: TOKENS.ink, lineHeight: 28, letterSpacing: -0.3 },
  closeBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: TOKENS.mutedBg, alignItems: 'center', justifyContent: 'center' },

  producerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 18 },
  producerText: { fontSize: 13, fontWeight: '600', color: TOKENS.stone },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 8, backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  ratingText: { fontSize: 12, fontWeight: '800', color: '#B45309' },

  priceGrid: { flexDirection: 'row', backgroundColor: TOKENS.mutedBg, borderRadius: 16, padding: 16, marginBottom: 14 },
  priceCell: { flex: 1, alignItems: 'center' },
  priceCellDivider: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: TOKENS.border },
  priceCellLabel: { fontSize: 11, fontWeight: '700', color: TOKENS.inkMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  priceCellValue: { fontSize: 16, fontWeight: '800', color: TOKENS.ink, fontVariant: ['tabular-nums'] },
  currency: { fontSize: 12, fontWeight: '600', color: TOKENS.inkMuted },

  warnRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14, backgroundColor: STATUS_BG.disputed, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },
  warnText: { fontSize: 12, fontWeight: '700', color: TOKENS.red },

  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: TOKENS.navy,
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: TOKENS.navy,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaDisabled: { backgroundColor: '#CBD5E1', shadowOpacity: 0 },
  ctaText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },

  // ── Tracking Sheet ──
  trackHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  statusText: { fontSize: 13, fontWeight: '800' },
  etaBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: TOKENS.blue + '10', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  etaText: { fontSize: 12, fontWeight: '800', color: TOKENS.blue, fontVariant: ['tabular-nums'] },
  trackSub: { fontSize: 13, fontWeight: '600', color: TOKENS.stone, marginBottom: 20 },

  // ── Stepper ──
  stepper: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 22 },
  stepNode: { alignItems: 'center', width: 72 },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepTitle: { fontSize: 11, fontWeight: '600', color: TOKENS.inkMuted, textAlign: 'center', marginBottom: 2 },
  stepSubtitle: { fontSize: 9, fontWeight: '700', color: '#CBD5E1', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.3 },
  stepRail: { flex: 1, height: 3, borderRadius: 2, marginTop: 20, marginHorizontal: -10 },

  // ── Dispute ──
  disputeBox: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 14, marginBottom: 20 },
  disputeText: { flex: 1, fontSize: 13, fontWeight: '700', color: TOKENS.red, lineHeight: 18 },

  // ── Driver Card ──
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: TOKENS.mutedBg,
    borderRadius: 18,
    marginBottom: 14,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: TOKENS.blue + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverAvatarText: { fontSize: 16, fontWeight: '800', color: TOKENS.blue },
  driverInfo: { flex: 1, marginLeft: 14 },
  driverName: { fontSize: 15, fontWeight: '800', color: TOKENS.ink, marginBottom: 4 },
  driverMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  driverMetaText: { fontSize: 12, fontWeight: '600', color: TOKENS.stone },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1' },
  driverActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Product Summary ──
  productSummary: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 4 },
  productSummaryText: { flex: 1, fontSize: 13, fontWeight: '700', color: TOKENS.stone },
});