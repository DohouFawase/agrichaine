import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TextInput, 
  ActivityIndicator, 
  StyleSheet, 
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Dimensions
} from 'react-native';
import { router } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { fetchOrdersAction } from '@/providers/orders/ordersProviderAction';
import { 
  Search, 
  X, 
  Package, 
  Truck, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  ShoppingBag, 
  AlertCircle,
  SlidersHorizontal
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

// ─── Types & Config ─────────────────────────────────────────────
type OrderStatus = 'paid_searching_driver' | 'assigned_to_driver' | 'collected' | 'delivered';

interface StatusConfig {
  label: string;
  shortLabel: string;
  color: string;
  bgColor: string;
  icon: React.ElementType;
  step: number; // 1 à 4 pour la timeline
}

const STATUS_CONFIG: Record<OrderStatus | string, StatusConfig> = {
  paid_searching_driver: {
    label: 'Recherche chauffeur',
    shortLabel: 'En attente',
    color: '#8B5CF6',
    bgColor: '#F3EEFD',
    icon: Clock,
    step: 1,
  },
  assigned_to_driver: {
    label: 'Chauffeur assigné',
    shortLabel: 'En route',
    color: '#E69B00',
    bgColor: '#FEF6E6',
    icon: Truck,
    step: 2,
  },
  collected: {
    label: 'En transport',
    shortLabel: 'Transport',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    icon: MapPin,
    step: 3,
  },
  delivered: {
    label: 'Livré',
    shortLabel: 'Terminé',
    color: '#1D9E75',
    bgColor: '#E8F5EE',
    icon: CheckCircle2,
    step: 4,
  },
};

const FILTERS = [
  { key: 'all', label: 'Toutes', icon: SlidersHorizontal },
  { key: 'active', label: 'En cours', icon: Truck },
  { key: 'delivered', label: 'Livrées', icon: CheckCircle2 },
];

// ─── Composant Timeline ─────────────────────────────────────────
const OrderTimeline = ({ currentStep }: { currentStep: number }) => {
  const steps = [
    { icon: Clock, label: 'Payé' },
    { icon: Truck, label: 'Assigné' },
    { icon: MapPin, label: 'Transport' },
    { icon: CheckCircle2, label: 'Livré' },
  ];

  return (
    <View style={timelineStyles.container}>
      {steps.map((step, idx) => {
        const isActive = idx + 1 <= currentStep;
        const isCurrent = idx + 1 === currentStep;
        const StepIcon = step.icon;
        
        return (
          <View key={idx} style={timelineStyles.stepWrapper}>
            <View style={[
              timelineStyles.dot,
              isActive && timelineStyles.dotActive,
              isCurrent && timelineStyles.dotCurrent,
            ]}>
              <StepIcon 
                size={12} 
                color={isActive ? '#FFF' : '#CBD5E1'} 
                strokeWidth={2.5}
              />
            </View>
            {idx < steps.length - 1 && (
              <View style={[
                timelineStyles.line,
                idx + 1 < currentStep && timelineStyles.lineActive
              ]} />
            )}
          </View>
        );
      })}
    </View>
  );
};

// ─── Composant Carte Commande ───────────────────────────────────
const OrderCard = ({ item, userRole }: { item: any; userRole: string | null }) => {
  const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.paid_searching_driver;
  const StatusIcon = config.icon;
  
  const handlePress = () => {
    router.push({
      pathname: '/other/orderdetailScreen',
      params: { id: item.id },
    });
  };

  return (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.8}
      onPress={handlePress}
    >
      {/* Ligne principale */}
      <View style={styles.cardRow}>
        {/* Image / Icon */}
        <View style={[styles.imageBox, { backgroundColor: config.bgColor }]}>
          <Package size={24} color={config.color} strokeWidth={2} />
        </View>

        {/* Infos */}
        <View style={styles.infoBox}>
          <View style={styles.titleRow}>
            <Text style={styles.productName} numberOfLines={1}>
              {item.product?.name || 'Produit Vivrier'}
            </Text>
            <ChevronRight size={18} color="#CBD5E1" />
          </View>

          <Text style={styles.metaText}>
            Commande #{item.id?.slice(-8).toUpperCase()} · {item.quantity_ordered} {item.product?.unit || 'kg'}
          </Text>

          {/* Badge statut */}
          <View style={[styles.badge, { backgroundColor: config.bgColor }]}>
            <StatusIcon size={14} color={config.color} strokeWidth={2.5} />
            <Text style={[styles.badgeText, { color: config.color }]}>
              {config.label}
            </Text>
          </View>
        </View>
      </View>

      {/* Timeline visuelle */}
      <View style={styles.timelineSection}>
        <OrderTimeline currentStep={config.step} />
        <Text style={styles.timelineLabel}>
          {config.step === 4 
            ? (userRole === 'producer' ? 'Vendu & Livré' : 'Commande reçue') 
            : `Étape ${config.step}/4`}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// ─── Écran Principal ────────────────────────────────────────────
export default function OrderListScreen() {
  const dispatch = useAppDispatch();
  const { orders, isLoading, error, userRole } = useAppSelector((state) => state.orders);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    dispatch(fetchOrdersAction());
  }, [dispatch]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    dispatch(fetchOrdersAction()).finally(() => setRefreshing(false));
  }, [dispatch]);

  // Filtres combinés (recherche + tab)
  const filteredOrders = useMemo(() => {
    let result = orders;
    
    // Filtre par statut
    if (activeFilter === 'active') {
      result = result.filter((o: any) => o.status !== 'delivered');
    } else if (activeFilter === 'delivered') {
      result = result.filter((o: any) => o.status === 'delivered');
    }

    // Filtre recherche
    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase();
      result = result.filter((o: any) => 
        (o.product?.name || '').toLowerCase().includes(term) ||
        o.status.toLowerCase().includes(term) ||
        o.id.toLowerCase().includes(term)
      );
    }
    
    return result;
  }, [orders, activeFilter, searchQuery]);

  // ─── Loading ─────────────────────────────────────────────────
  if (isLoading && orders.length === 0 && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1D9E75" />
        <Text style={styles.loadingText}>Chargement de vos commandes...</Text>
      </View>
    );
  }

  // ─── Error ───────────────────────────────────────────────────
  if (error && orders.length === 0) {
    return (
      <View style={styles.center}>
        <AlertCircle size={48} color="#EF4444" strokeWidth={1.5} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={() => dispatch(fetchOrdersAction())}
        >
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Mes Commandes</Text>
          <Text style={styles.headerSubtitle}>
            {orders.length} commande{orders.length !== 1 ? 's' : ''} au total
          </Text>
        </View>
        <View style={styles.headerBadge}>
          <ShoppingBag size={20} color="#1D9E75" strokeWidth={2} />
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBox}>
          <Search size={18} color="#94A3B8" strokeWidth={2.5} />
          <TextInput
            placeholder="Rechercher une commande..."
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color="#94A3B8" strokeWidth={2.5} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtres horizontaux */}
      <View style={styles.filterWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter.key;
            const FilterIcon = filter.icon;
            return (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterChip,
                  isActive && styles.filterChipActive
                ]}
                onPress={() => setActiveFilter(filter.key)}
              >
                <FilterIcon 
                  size={14} 
                  color={isActive ? '#FFF' : '#64748B'} 
                  strokeWidth={2.5}
                />
                <Text style={[
                  styles.filterText,
                  isActive && styles.filterTextActive
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Liste */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1D9E75"
            colors={['#1D9E75']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <ShoppingBag size={56} color="#CBD5E1" strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>Aucune commande</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery 
                ? 'Modifiez votre recherche' 
                : 'Vos commandes apparaîtront ici'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <OrderCard item={item} userRole={userRole} />
        )}
      />
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#1D9E75',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: { 
    color: '#FFF', 
    fontWeight: '700', 
    fontSize: 15 
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '500',
  },
  headerBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#E8F5EE',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Search
  searchWrapper: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
    marginLeft: 10,
  },

  // Filtres
  filterWrapper: {
    marginBottom: 8,
  },
  filterScroll: {
    paddingHorizontal: 24,
    gap: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 10,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: '#1D9E75',
    borderColor: '#1D9E75',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },

  // List
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 8,
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  infoBox: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  metaText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 10,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Timeline dans la carte
  timelineSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },

  // Empty
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 16,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
});

// ─── Timeline Styles ────────────────────────────────────────────
const timelineStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  dotActive: {
    backgroundColor: '#1D9E75',
    borderColor: '#1D9E75',
  },
  dotCurrent: {
    backgroundColor: '#1D9E75',
    borderColor: '#1D9E75',
    shadowColor: '#1D9E75',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  line: {
    width: 20,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 4,
  },
  lineActive: {
    backgroundColor: '#1D9E75',
  },
});