import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/stores/index';
import {
  fetchProductsForMap,
  fetchActiveOrderTracking,
  fetchMyOrders,
  fetchWalletBalance,
  createOrder,
  reportDispute,
  CreateOrderPayload,
} from '@/providers/maps/mapsProviderAction';
import {
  selectProduct,
  setActiveOrderId,
  clearOrderError,
  clearDisputeState,
} from '@/slice/mapSlice';
import type { ProductLocation } from '@/providers/maps/mapsProviderAction';

// Intervalle de polling pour la position du chauffeur (ms)
const DRIVER_POLL_INTERVAL = 8_000;

// ─────────────────────────────────────────────
// HOOK PRINCIPAL : useMapsTracking
// Tout ce dont l'écran Maps a besoin en un seul hook
// ─────────────────────────────────────────────

export function useMapsTracking() {
  const dispatch = useDispatch<AppDispatch>();
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Sélecteurs ──
  const products          = useSelector((s: RootState) => s.maps.products);
  const productsLoading   = useSelector((s: RootState) => s.maps.productsLoading);
  const productsError     = useSelector((s: RootState) => s.maps.productsError);

  const selectedProduct       = useSelector((s: RootState) => s.maps.selectedProduct);
  const selectedProductLoading = useSelector((s: RootState) => s.maps.selectedProductLoading);

  const activeOrder       = useSelector((s: RootState) => s.maps.activeOrder);
  const activeOrderId     = useSelector((s: RootState) => s.maps.activeOrderId);
  const activeOrderLoading = useSelector((s: RootState) => s.maps.activeOrderLoading);
  const activeOrderError  = useSelector((s: RootState) => s.maps.activeOrderError);

  const orderCreating     = useSelector((s: RootState) => s.maps.orderCreating);
  const orderCreateError  = useSelector((s: RootState) => s.maps.orderCreateError);

  const walletBalance     = useSelector((s: RootState) => s.maps.walletBalance);
  const walletCurrency    = useSelector((s: RootState) => s.maps.walletCurrency);

  const disputeLoading    = useSelector((s: RootState) => s.maps.disputeLoading);
  const disputeSuccess    = useSelector((s: RootState) => s.maps.disputeSuccess);
  const disputeError      = useSelector((s: RootState) => s.maps.disputeError);

  // ── Statut lisible pour l'UI ──
  const orderStatus = activeOrder?.status ?? null;
  const driverCoords = activeOrder?.driver
    ? {
        latitude: activeOrder.driver.latitude,
        longitude: activeOrder.driver.longitude,
      }
    : null;
  const producerCoords = activeOrder?.product
    ? {
        latitude: activeOrder.product.producer_latitude,
        longitude: activeOrder.product.producer_longitude,
      }
    : null;

  // ETA label selon le statut
  const etaLabel = (() => {
    switch (orderStatus) {
      case 'pending':   return 'Recherche d\'un chauffeur...';
      case 'assigned':  return 'Chauffeur en route vers le producteur';
      case 'collected': return 'Marchandise collectée — en livraison vers vous';
      case 'delivered': return 'Livraison confirmée';
      case 'disputed':  return 'Litige en cours de traitement';
      default:          return null;
    }
  })();

  // ── Chargement initial ──
  useEffect(() => {
    dispatch(fetchProductsForMap());
    dispatch(fetchMyOrders());     // retrouve une commande active si elle existe
    dispatch(fetchWalletBalance());
  }, [dispatch]);

  // ── Polling du suivi chauffeur ──
  const startPolling = useCallback((orderId: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    // Premier appel immédiat
    dispatch(fetchActiveOrderTracking(orderId));

    // Puis toutes les 8 secondes
    pollingRef.current = setInterval(() => {
      dispatch(fetchActiveOrderTracking(orderId));
    }, DRIVER_POLL_INTERVAL);
  }, [dispatch]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // Démarre/arrête le polling selon qu'il y a une commande active
  useEffect(() => {
    if (activeOrderId && !['delivered', 'disputed'].includes(orderStatus ?? '')) {
      startPolling(activeOrderId);
    } else {
      stopPolling();
    }
    return stopPolling; // cleanup au démontage
  }, [activeOrderId, orderStatus, startPolling, stopPolling]);

  // ── Actions exposées ──

  const onPinPress = useCallback((product: ProductLocation) => {
    dispatch(selectProduct(product));
  }, [dispatch]);

  const onCloseBottomSheet = useCallback(() => {
    dispatch(selectProduct(null));
  }, [dispatch]);

  const onOrderProduct = useCallback(async (payload: CreateOrderPayload) => {
    const result = await dispatch(createOrder(payload));
    if (createOrder.fulfilled.match(result)) {
      // Lance le polling immédiatement après création
      startPolling(result.payload.order_id);
    }
  }, [dispatch, startPolling]);

  const onReportDispute = useCallback(
    (orderId: string, reason: string, proof_photo: File) => {
      dispatch(reportDispute({ orderId, reason, proof_photo }));
    },
    [dispatch]
  );

  const onClearOrderError  = useCallback(() => dispatch(clearOrderError()),  [dispatch]);
  const onClearDispute     = useCallback(() => dispatch(clearDisputeState()), [dispatch]);

  // ─────────────────────────────────────────────
  return {
    // Produits (pins carte)
    products,
    productsLoading,
    productsError,

    // Bottom sheet
    selectedProduct,
    selectedProductLoading,

    // Suivi commande + chauffeur
    activeOrder,
    activeOrderLoading,
    activeOrderError,
    orderStatus,
    driverCoords,      // { latitude, longitude } du chauffeur — à passer au Marker
    producerCoords,    // { latitude, longitude } du producteur
    etaLabel,

    // Création commande
    orderCreating,
    orderCreateError,

    // Portefeuille
    walletBalance,
    walletCurrency,

    // Litige
    disputeLoading,
    disputeSuccess,
    disputeError,

    // Actions
    onPinPress,
    onCloseBottomSheet,
    onOrderProduct,
    onReportDispute,
    onClearOrderError,
    onClearDispute,
    refreshProducts: () => dispatch(fetchProductsForMap()),
  };
}