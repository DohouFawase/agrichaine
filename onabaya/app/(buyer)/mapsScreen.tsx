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

const STEP_ORDER = ['pending', 'assigned', 'collected', 'delivered'];

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
  // Demande la permission puis récupère la position courante,
  // utilisée pour centrer la carte au démarrage et pour le pin "vous êtes ici"
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

  // Recentre la carte sur la position de l'acheteur dès qu'elle est connue,
  // sauf si une commande est déjà en cours (priorité au suivi chauffeur)
  useEffect(() => {
    if (buyerCoords && !activeOrder) {
      mapRef.current?.animateCamera(
        { center: buyerCoords, zoom: 13 },
        { duration: 500 }
      );
    }
  }, [buyerCoords, activeOrder]);

  // Recentre la carte sur le chauffeur quand ses coords changent
  useEffect(() => {
    if (driverCoords?.latitude && driverCoords?.longitude) {
      mapRef.current?.animateCamera(
        { center: driverCoords, zoom: 13 },
        { duration: 600 }
      );
    }
  }, [driverCoords?.latitude, driverCoords?.longitude]);

  // Alerte si erreur création commande
  useEffect(() => {
    if (orderCreateError) Alert.alert('Erreur', orderCreateError);
  }, [orderCreateError]);

  // ── Points du trajet à afficher ──
  // Ligne bleue pointillée = trajet restant (chauffeur → acheteur)
  // Ligne verte = partie déjà parcourue (producteur → chauffeur)
  const remainingCoords = [];
  if (driverCoords?.latitude) remainingCoords.push(driverCoords);
  if (activeOrder) {
    remainingCoords.push({
      latitude: activeOrder.buyer_latitude,
      longitude: activeOrder.buyer_longitude,
    });
  }

  const doneCoords = [];
  if (producerCoords && driverCoords?.latitude) {
    doneCoords.push(producerCoords);
    doneCoords.push(driverCoords);
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
        {/* Pins produits disponibles */}
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

        {/* Pin producteur (commande active) */}
        {producerCoords && (
          <Marker
            coordinate={producerCoords}
            pinColor="#1D9E75"
            title="Producteur"
            description={activeOrder?.product?.name}
          />
        )}

        {/* Pin chauffeur — pulsant, animé via polling */}
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

        {/* Trajet restant (pointillé bleu) */}
        {remainingCoords.length >= 2 && (
          <Polyline
            coordinates={remainingCoords}
            strokeColor="#185FA5"
            strokeWidth={3}
            lineDashPattern={[8, 5]}
          />
        )}

        {/* Portion déjà parcourue (vert plein) */}
        {doneCoords.length >= 2 && (
          <Polyline
            coordinates={doneCoords}
            strokeColor="#1D9E75"
            strokeWidth={4}
          />
        )}
      </MapView>

      {/* ── LOADER PRODUITS ── */}
      {productsLoading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator color="#185FA5" />
        </View>
      )}

      {/* ── ALERTE GÉOLOCALISATION ── */}
      {locationError && !activeOrder && (
        <View style={styles.locationWarnPill}>
          <Text style={styles.locationWarnText}>{locationError}</Text>
        </View>
      )}

      {/* ── DISTANCE FLOTTANTE (si commande active) ── */}
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

      {/* ── BOTTOM SHEET : PRODUIT SÉLECTIONNÉ ── */}
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

      {/* ── BOTTOM SHEET : SUIVI COMMANDE ACTIVE (journal de livraison) ── */}
      {activeOrder && (
        <OrderTrackingSheet order={activeOrder} statusColor={STATUS_COLOR} />
      )}

      {/* ── BOUTON REFRESH ── */}
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
// BOTTOM SHEET : JOURNAL DE LIVRAISON (timeline narrative)
// ─────────────────────────────────────────────

function OrderTrackingSheet({
  order,
  statusColor,
}: {
  order: any;
  statusColor: Record<string, string>;
}) {
  const currentIdx = STEP_ORDER.indexOf(order.status);
  const isDisputed = order.status === 'disputed';

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

  return (
    <View style={styles.bottomSheet}>
      {/* Journal de livraison : un événement par étape franchie */}
      <View style={styles.timeline}>
        {STEP_ORDER.map((step, i) => {
          if (isDisputed && step !== 'disputed') return null;
          const isPast = i < currentIdx;
          const isCurrent = i === currentIdx;

          const event = TIMELINE_EVENTS[step];
          const dotColor = isPast || isCurrent ? (statusColor[step] ?? '#1D9E75') : '#d3d1c7';
          const isLast = i === STEP_ORDER.length - 1;

          return (
            <View key={step} style={styles.timelineRow}>
              <View style={styles.timelineRailCol}>
                <View style={[styles.timelineDot, { backgroundColor: dotColor }]} />
                {!isLast && (
                  <View
                    style={[
                      styles.timelineRail,
                      { backgroundColor: isPast ? (statusColor[step] ?? '#1D9E75') : '#d3d1c7' },
                    ]}
                  />
                )}
              </View>
              <View style={isLast ? undefined : styles.timelineContent}>
                {(isPast || isCurrent) ? (
                  <>
                    <Text
                      style={[
                        styles.timelineLabel,
                        isCurrent && styles.timelineLabelCurrent,
                      ]}
                    >
                      {event.label(order)}
                    </Text>
                    <Text
                      style={[
                        styles.timelineSublabel,
                        isCurrent && { color: statusColor[step] ?? '#993c1d' },
                      ]}
                    >
                      {event.sublabel(order)}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.timelineFutureLabel}>
                    {step === 'delivered' ? 'Livraison' : event.label(order)}
                  </Text>
                )}
              </View>
            </View>
          );
        })}

        {isDisputed && (
          <View style={styles.timelineRow}>
            <View style={styles.timelineRailCol}>
              <View style={[styles.timelineDot, { backgroundColor: statusColor.disputed }]} />
            </View>
            <View>
              <Text style={[styles.timelineLabel, { color: statusColor.disputed }]}>
                {TIMELINE_EVENTS.disputed.label(order)}
              </Text>
              <Text style={styles.timelineSublabel}>{TIMELINE_EVENTS.disputed.sublabel(order)}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Carte chauffeur avec appel direct */}
      {order.driver && (
        <View style={styles.driverRow}>
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
              ⭐ {order.driver.average_rating}
              {order.driver.vehicle_type ? `  ·  ${order.driver.vehicle_type}` : ''}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.callBtn}
            onPress={handleCallDriver}
            disabled={!order.driver.phone}
          >
            <Text style={styles.callBtnText}>Appeler</Text>
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

  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    borderTopWidth: 0.5,
    borderColor: '#d3d1c7',
  },
  closeBtn:       { position: 'absolute', top: 16, right: 16 },
  closeBtnText:   { fontSize: 16, color: '#888780' },
  productName:    { fontSize: 18, fontWeight: '600', color: '#2c2c2a', marginBottom: 4 },
  productMeta:    { fontSize: 13, color: '#5f5e5a', marginBottom: 4 },
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

  // ── Timeline (journal de livraison) ──
  timeline:       { marginBottom: 16 },
  timelineRow:    { flexDirection: 'row' },
  timelineRailCol: { width: 20, alignItems: 'center' },
  timelineDot:    { width: 10, height: 10, borderRadius: 5 },
  timelineRail:   { width: 2, flex: 1, marginTop: 2, minHeight: 24 },
  timelineContent: { paddingBottom: 16, marginLeft: 10, flex: 1 },
  timelineLabel:  { fontSize: 13, color: '#2c2c2a' },
  timelineLabelCurrent: { fontWeight: '600' },
  timelineSublabel: { fontSize: 11, color: '#888780', marginTop: 2 },
  timelineFutureLabel: { fontSize: 12, color: '#888780', marginLeft: 10 },

  driverRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10, paddingTop: 4, borderTopWidth: 0.5, borderColor: '#d3d1c7' },
  driverAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e6f1fb',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  driverAvatarText: { fontSize: 14, fontWeight: '600', color: '#185fa5' },
  driverName:     { fontSize: 14, fontWeight: '500', color: '#2c2c2a' },
  driverMeta:     { fontSize: 12, color: '#888780' },

  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#e6f1fb',
    marginTop: 14,
  },
  callBtnText:    { fontSize: 12, fontWeight: '600', color: '#185fa5' },
});