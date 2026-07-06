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
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useMapsTracking } from '@/hooks/usemapsTracking';
import type { ProductLocation } from '@/providers/maps/mapsProviderAction';

// ─────────────────────────────────────────────
// Couleurs statuts
// ─────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  pending:   '#888780',
  assigned:  '#D85A30',
  collected: '#1D9E75',
  delivered: '#185FA5',
  disputed:  '#E24B4A',
};

// Libellés du journal de livraison (timeline narrative)
const TIMELINE_EVENTS: Record<
  string,
  { label: (order: any) => string; sublabel: (order: any) => string; icon: string }
> = {
  pending: {
    label: () => 'Recherche d\u2019un chauffeur',
    sublabel: () => 'On cherche quelqu\u2019un pour ta commande',
    icon: '🔍',
  },
  assigned: {
    label: (o) => `${o.driver?.name ?? 'Le chauffeur'} arrive chez le producteur`,
    sublabel: (o) => (o.eta_pickup_label ? `Estimé ${o.eta_pickup_label}` : 'En approche'),
    icon: '🛡️',
  },
  collected: {
    label: (o) => `${o.driver?.name ?? 'Le chauffeur'} a récupéré ${o.product?.name ?? 'ton produit'}`,
    sublabel: (o) => (o.collected_at_label ? o.collected_at_label : 'En route vers chez toi'),
    icon: '📦',
  },
  delivered: {
    label: () => 'Livré chez toi',
    sublabel: (o) => (o.delivered_at_label ? o.delivered_at_label : 'Commande terminée'),
    icon: '✅',
  },
  disputed: {
    label: () => 'Litige en cours',
    sublabel: () => 'Notre équipe a été notifiée',
    icon: '⚠️',
  },
};

const STEP_ORDER = ['pending', 'assigned', 'collected', 'delivered'];

const STEP_TITLES: Record<string, string> = {
  pending: 'Commande confirmée',
  assigned: 'En approche',
  collected: 'Récupéré',
  delivered: 'Livré',
};

// ─────────────────────────────────────────────
// ÉCRAN MAPS ACHETEUR
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
    orderStatus,
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

  // ── Géolocalisation de l'acheteur ──
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (isMounted) setLocationError('Localisation refusée');
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

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

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (buyerCoords && !activeOrder) {
      mapRef.current?.animateCamera(
        { center: buyerCoords, zoom: 13 },
        { duration: 500 }
      );
    }
  }, [buyerCoords, activeOrder]);

  useEffect(() => {
    if (driverCoords?.latitude && driverCoords?.longitude) {
      mapRef.current?.animateCamera(
        { center: driverCoords, zoom: 13 },
        { duration: 600 }
      );
    }
  }, [driverCoords?.latitude, driverCoords?.longitude]);

  useEffect(() => {
    if (orderCreateError) Alert.alert('Erreur', orderCreateError);
  }, [orderCreateError]);

  useEffect(() => {
    if (activeOrder?.status === 'pending') {
      const center = producerCoords ?? buyerCoords;
      if (center) {
        mapRef.current?.animateCamera(
          { center, zoom: 14 },
          { duration: 500 }
        );
      }
    }
  }, [activeOrder?.status, producerCoords, buyerCoords]);

  // ─────────────────────────────────────────────
  // Construction des tracés selon la phase de la commande
  // - "pending"/"assigned"  → le chauffeur va CHERCHER la commande : trajet chauffeur → producteur
  // - "collected"/"delivered" → le chauffeur a récupéré : trajet fait (producteur → chauffeur)
  //                              + trajet restant (chauffeur → acheteur)
  // ─────────────────────────────────────────────
  const isPickupPhase = activeOrder && ['pending', 'assigned'].includes(activeOrder.status);
  const isTransitPhase = activeOrder && ['collected', 'delivered'].includes(activeOrder.status);

  const remainingCoords: { latitude: number; longitude: number }[] = [];
  const doneCoords: { latitude: number; longitude: number }[] = [];

  const isSearchingPhase = activeOrder && activeOrder.status === 'pending';
  const radarCenter = producerCoords ?? buyerCoords;

  if (activeOrder && driverCoords?.latitude) {
    if (isPickupPhase && producerCoords) {
      // Trajet restant : chauffeur → producteur (pas encore récupéré)
      remainingCoords.push(driverCoords, producerCoords);
    } else if (isTransitPhase) {
      // Trajet déjà fait : producteur → position actuelle du chauffeur
      if (producerCoords) {
        doneCoords.push(producerCoords, driverCoords);
      }
      // Trajet restant : chauffeur → acheteur
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

      {/* ── CARTE ── */}
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
            pinColor="#1D9E75"
            title={product.name}
            description={`${product.quantity} ${product.unit} — ${product.price_per_unit} ${walletCurrency}`}
          />
        ))}

        {producerCoords && (
          <Marker
            coordinate={producerCoords}
            pinColor="#1D9E75"
            title="Producteur"
            description={activeOrder?.product?.name}
          />
        )}

        {isSearchingPhase && radarCenter && (
          <Marker
            coordinate={radarCenter}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={true}
          >
            <RadarSearchPin />
          </Marker>
        )}

        {driverCoords?.latitude && (
          <Marker
            coordinate={driverCoords}
            anchor={{ x: 0.5, y: 0.5 }}
            title={`${activeOrder?.driver?.name ?? 'Chauffeur'}`}
            description="En transit"
          >
            <PulsingDriverPin />
          </Marker>
        )}

        {remainingCoords.length >= 2 && (
          <Polyline
            coordinates={remainingCoords}
            strokeColor="#185FA5"
            strokeWidth={3}
            lineDashPattern={[8, 5]}
          />
        )}

        {doneCoords.length >= 2 && (
          <Polyline
            coordinates={doneCoords}
            strokeColor="#1D9E75"
            strokeWidth={4}
          />
        )}
      </MapView>

      {productsLoading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator color="#185FA5" />
        </View>
      )}

      {locationError && !activeOrder && (
        <View style={styles.locationWarnPill}>
          <Text style={styles.locationWarnText}>{locationError}</Text>
        </View>
      )}

      {distanceRemainingLabel && driverCoords?.latitude && (
        <View
          style={[
            styles.distancePill,
            { top: '42%' },
          ]}
        >
          <Text style={styles.distancePillText}>{distanceRemainingLabel}</Text>
        </View>
      )}

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
        <OrderTrackingSheet order={activeOrder} statusColor={STATUS_COLOR} etaLabel={etaLabel} />
      )}

      {!activeOrder && (
        <TouchableOpacity style={styles.refreshBtn} onPress={refreshProducts}>
          <Text style={styles.refreshBtnText}>Actualiser</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────
// PIN CHAUFFEUR ANIMÉ (halo qui pulse)
// ─────────────────────────────────────────────

function PulsingDriverPin() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });

  return (
    <View style={styles.driverPinWrap}>
      <Animated.View
        style={[
          styles.driverPinHalo,
          { transform: [{ scale }], opacity },
        ]}
      />
      <View style={styles.driverPinDot} />
    </View>
  );
}

// ─────────────────────────────────────────────
// RADAR DE RECHERCHE CHAUFFEUR (statut "pending")
// 3 anneaux qui s'étendent et s'effacent, décalés dans le temps
// ─────────────────────────────────────────────

function RadarSearchPin() {
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const makeLoop = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 1,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );

    const loop1 = makeLoop(ring1, 0);
    const loop2 = makeLoop(ring2, 600);
    const loop3 = makeLoop(ring3, 1200);

    loop1.start();
    loop2.start();
    loop3.start();

    return () => {
      loop1.stop();
      loop2.stop();
      loop3.stop();
    };
  }, [ring1, ring2, ring3]);

  const ringStyle = (val: Animated.Value) => ({
    transform: [
      {
        scale: val.interpolate({ inputRange: [0, 1], outputRange: [0.3, 3.2] }),
      },
    ],
    opacity: val.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.6, 0.2, 0] }),
  });

  return (
    <View style={styles.radarWrap}>
      <Animated.View style={[styles.radarRing, ringStyle(ring1)]} />
      <Animated.View style={[styles.radarRing, ringStyle(ring2)]} />
      <Animated.View style={[styles.radarRing, ringStyle(ring3)]} />
      <View style={styles.radarCore}>
        <Text style={styles.radarCoreIcon}>🔍</Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// BOTTOM SHEET : DÉTAIL PRODUIT + COMMANDE
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
    <View style={styles.bottomSheet}>
      <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
        <Text style={styles.closeBtnText}>✕</Text>
      </TouchableOpacity>

      <Text style={styles.productName}>{product.name}</Text>
      <Text style={styles.productMeta}>
        {product.quantity} {product.unit}  ·  {product.price_per_unit} {walletCurrency}/{product.unit}
      </Text>
      <Text style={styles.producerName}>
        Producteur : {product.producer?.name} {product.producer?.last_name}
        {'  '}⭐ {product.producer?.average_rating}
      </Text>

      <View style={styles.priceRow}>
        <View>
          <Text style={styles.priceLabel}>Total produit</Text>
          <Text style={styles.priceValue}>{totalPrice.toLocaleString()} {walletCurrency}</Text>
        </View>
        <View>
          <Text style={styles.priceLabel}>Livraison</Text>
          <Text style={styles.priceValue}>{DELIVERY_PRICE.toLocaleString()} {walletCurrency}</Text>
        </View>
        <View>
          <Text style={styles.priceLabel}>Total</Text>
          <Text style={[styles.priceValue, { color: '#185FA5' }]}>
            {totalWithDelivery.toLocaleString()} {walletCurrency}
          </Text>
        </View>
      </View>

      {walletBalance !== null && !canAfford && (
        <Text style={styles.balanceWarn}>
          Solde insuffisant ({walletBalance.toLocaleString()} {walletCurrency})
        </Text>
      )}

      <TouchableOpacity
        style={[styles.orderBtn, (!canAfford || loading) && styles.orderBtnDisabled]}
        onPress={() => onOrder(qty, totalPrice, DELIVERY_PRICE)}
        disabled={!canAfford || loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.orderBtnText}>Commander — fonds sécurisés</Text>
        }
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────
// BOTTOM SHEET : SUIVI COMMANDE (style stepper horizontal, cf. screenshot)
// ─────────────────────────────────────────────

function OrderTrackingSheet({
  order,
  statusColor,
  etaLabel,
}: {
  order: any;
  statusColor: Record<string, string>;
  etaLabel?: string | null;
}) {
  const currentIdx = STEP_ORDER.indexOf(order.status);
  const isDisputed = order.status === 'disputed';
  const currentEvent = TIMELINE_EVENTS[order.status] ?? TIMELINE_EVENTS.pending;

  const handleCallDriver = () => {
    if (!order.driver?.phone) return;
    const phoneUrl = Platform.select({
      ios: `telprompt:${order.driver.phone}`,
      default: `tel:${order.driver.phone}`,
    });
    Linking.openURL(phoneUrl!).catch(() => {
      Alert.alert('Erreur', 'Impossible de lancer l\u2019appel');
    });
  };

  const handleMessageDriver = () => {
    Alert.alert('Message', 'La messagerie chauffeur arrive bientôt.');
  };

  return (
    <View style={styles.bottomSheet}>
      {/* ── En-tête : statut + ETA ── */}
      <View style={styles.trackHeaderRow}>
        <Text style={styles.trackHeaderTitle}>
          {isDisputed ? 'Litige en cours' : currentEvent.label(order)}
        </Text>
        {!isDisputed && etaLabel && (
          <View style={styles.etaPill}>
            <Text style={styles.etaPillText}>⏱ {etaLabel}</Text>
          </View>
        )}
      </View>
      <Text style={styles.trackHeaderSub}>{currentEvent.sublabel(order)}</Text>

      {/* ── Stepper horizontal (icônes + rail) ── */}
      {!isDisputed && (
        <View style={styles.stepperRow}>
          {STEP_ORDER.map((step, i) => {
            const isPast = i < currentIdx;
            const isCurrent = i === currentIdx;
            const isDone = isPast || isCurrent;
            const color = isDone ? (statusColor[step] ?? '#1D9E75') : '#d3d1c7';
            const isLast = i === STEP_ORDER.length - 1;

            return (
              <React.Fragment key={step}>
                <View style={styles.stepperIconWrap}>
                  <View
                    style={[
                      styles.stepperIconCircle,
                      { backgroundColor: isDone ? color : '#f1efe8', borderColor: color },
                    ]}
                  >
                    <Text style={styles.stepperIconText}>{TIMELINE_EVENTS[step].icon}</Text>
                  </View>
                  <Text
                    style={[
                      styles.stepperLabel,
                      isCurrent && { color, fontWeight: '600' },
                    ]}
                    numberOfLines={1}
                  >
                    {STEP_TITLES[step]}
                  </Text>
                </View>
                {!isLast && (
                  <View
                    style={[
                      styles.stepperRail,
                      { backgroundColor: isPast ? (statusColor[step] ?? '#1D9E75') : '#d3d1c7' },
                    ]}
                  />
                )}
              </React.Fragment>
            );
          })}
        </View>
      )}

      {isDisputed && (
        <View style={styles.disputeBanner}>
          <Text style={styles.disputeBannerText}>{TIMELINE_EVENTS.disputed.sublabel(order)}</Text>
        </View>
      )}

      {/* ── Carte chauffeur : avatar + nom + appel/message ── */}
      {order.driver && (
        <View style={styles.driverCard}>
          <View style={styles.driverAvatar}>
            <Text style={styles.driverAvatarText}>
              {order.driver.name?.[0]}{order.driver.last_name?.[0]}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.driverName}>
              {order.driver.name} {order.driver.last_name}
            </Text>
            <Text style={styles.driverMeta}>
              Chauffeur · ⭐ {order.driver.average_rating}
              {order.driver.vehicle_type ? `  ·  ${order.driver.vehicle_type}` : ''}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={handleCallDriver}
            disabled={!order.driver.phone}
          >
            <Text style={styles.iconBtnText}>📞</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, styles.iconBtnDark]} onPress={handleMessageDriver}>
            <Text style={[styles.iconBtnText, { color: '#fff' }]}>💬</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Produit commandé */}
      <Text style={styles.productMeta}>
        {order.product?.name}  ·  {order.product?.quantity} {order.product?.unit}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container:      { flex: 1 },
  map:            { flex: 1 },
  loaderOverlay:  { position: 'absolute', top: 80, alignSelf: 'center' },

  locationWarnPill: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 0.5,
    borderColor: '#d3d1c7',
  },
  locationWarnText: { fontSize: 12, color: '#993c1d' },

  distancePill: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 0.5,
    borderColor: '#d3d1c7',
  },
  distancePillText: { fontSize: 11, fontWeight: '600', color: '#993c1d' },

  driverPinWrap:  { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  driverPinHalo: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#D85A30',
  },
  driverPinDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#D85A30',
    borderWidth: 2,
    borderColor: '#fff',
  },

  radarWrap: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarRing: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#D85A30',
    backgroundColor: 'rgba(216,90,48,0.15)',
  },
  radarCore: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#D85A30',
    elevation: 3,
  },
  radarCoreIcon: { fontSize: 13 },

  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingTop: 18,
    borderTopWidth: 0.5,
    borderColor: '#d3d1c7',
  },
  closeBtn:       { position: 'absolute', top: 16, right: 16 },
  closeBtnText:   { fontSize: 16, color: '#888780' },
  productName:    { fontSize: 18, fontWeight: '600', color: '#2c2c2a', marginBottom: 4 },
  productMeta:    { fontSize: 13, color: '#5f5e5a', marginTop: 14 },
  producerName:   { fontSize: 12, color: '#888780', marginBottom: 14 },

  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    backgroundColor: '#f1efe8',
    borderRadius: 10,
    padding: 12,
  },
  priceLabel:     { fontSize: 11, color: '#888780' },
  priceValue:     { fontSize: 14, fontWeight: '600', color: '#2c2c2a', marginTop: 2 },

  balanceWarn:    { fontSize: 12, color: '#e24b4a', marginBottom: 8 },

  orderBtn: {
    backgroundColor: '#1A3A6B',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  orderBtnDisabled: { backgroundColor: '#b4b2a9' },
  orderBtnText:   { color: '#fff', fontWeight: '600', fontSize: 14 },

  refreshBtn: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 0.5,
    borderColor: '#d3d1c7',
  },
  refreshBtnText: { fontSize: 13, color: '#185fa5', fontWeight: '500' },

  // ── Header suivi (titre + ETA pill) ──
  trackHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  trackHeaderTitle: { fontSize: 16, fontWeight: '700', color: '#2c2c2a', flexShrink: 1, marginRight: 8 },
  trackHeaderSub:   { fontSize: 12, color: '#888780', marginBottom: 16 },

  etaPill: {
    backgroundColor: '#f1efe8',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  etaPillText: { fontSize: 11, fontWeight: '600', color: '#5f5e5a' },

  // ── Stepper horizontal (icônes + rails) ──
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  stepperIconWrap: { alignItems: 'center', width: 56 },
  stepperIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperIconText: { fontSize: 16 },
  stepperLabel: {
    fontSize: 10,
    color: '#888780',
    marginTop: 4,
    textAlign: 'center',
  },
  stepperRail: {
    flex: 1,
    height: 2,
    marginTop: 19,
    marginHorizontal: -8,
  },

  disputeBanner: {
    backgroundColor: '#fcebea',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  disputeBannerText: { fontSize: 12, color: '#e24b4a', fontWeight: '500' },

  // ── Carte chauffeur (avatar + nom + boutons appel/message) ──
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 16,
    borderTopWidth: 0.5,
    borderColor: '#d3d1c7',
  },
  driverAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#e6f1fb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverAvatarText: { fontSize: 14, fontWeight: '600', color: '#185fa5' },
  driverName:     { fontSize: 14, fontWeight: '600', color: '#2c2c2a' },
  driverMeta:     { fontSize: 11, color: '#888780', marginTop: 1 },

  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1efe8',
  },
  iconBtnDark: { backgroundColor: '#1A3A6B' },
  iconBtnText: { fontSize: 15 },
});