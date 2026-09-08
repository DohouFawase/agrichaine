import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  Package,
  X,
  MapPin,
  Store,
  LayoutGrid,
  Wheat,
  Carrot,
  Apple,
  Sprout,
  Bean,
  SlidersHorizontal,
  AlertTriangle,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { fetchProductCategories, fetchProducts, ProductResource } from '@/providers/producers/producersProviderAction';

interface CategoryConfig {
  key: string;
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}

const CATEGORY_STYLES = [
  { icon: Wheat, color: '#D97706', bg: '#FFFBEB' },
  { icon: Carrot, color: '#16A34A', bg: '#F0FDF4' },
  { icon: Apple, color: '#EA580C', bg: '#FFF7ED' },
  { icon: Sprout, color: '#7C3AED', bg: '#F5F3FF' },
  { icon: Bean, color: '#0891B2', bg: '#ECFEFF' },
  { icon: Package, color: '#64748B', bg: '#F8FAFC' },
];

const ALL_CATEGORY: CategoryConfig = { key: 'all', label: 'Tous', icon: LayoutGrid, color: '#0F172A', bg: '#F1F5F9' };

// ─── Carte Produit (vue acheteur) ────────────────────────────────────────────
function ProductCard({
  item,
  onPress,
  formatPrice,
}: {
  item: ProductResource;
  onPress: () => void;
  formatPrice: (amount: number) => string;
}) {
  const catConfig: CategoryConfig = item.category_details
    ? { key: item.category_details.slug, label: item.category_details.name, ...CATEGORY_STYLES[item.category_details.id % CATEGORY_STYLES.length] }
    : { key: 'other', label: item.category || 'Autre', ...CATEGORY_STYLES[5] };
  const CatIcon = catConfig.icon;

  return (
    <TouchableOpacity activeOpacity={0.75} style={styles.card} onPress={onPress}>
      <View style={styles.cardInner}>
        {/* Image / Catégorie */}
        <View style={[styles.imageBox, { backgroundColor: catConfig.bg }]}>
          <CatIcon size={26} color={catConfig.color} strokeWidth={2} />
        </View>

        {/* Contenu */}
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            <View style={[styles.catBadge, { backgroundColor: catConfig.bg }]}>
              <Text style={[styles.catText, { color: catConfig.color }]}>{catConfig.label}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <MapPin size={12} color="#94A3B8" />
              <Text style={styles.metaText} numberOfLines={1}>{item.location}</Text>
            </View>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.metaText}>{item.quantity} {item.unit} dispo</Text>
          </View>

          {/* Producteur (si dispo) */}
          {(item as any).producer?.name && (
            <View style={styles.sellerRow}>
              <Store size={12} color="#94A3B8" />
              <Text style={styles.sellerText}>
                {(item as any).producer.name} {(item as any).producer.last_name || ''}
              </Text>
            </View>
          )}

          {/* Prix */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(item.price_per_unit)}</Text>
            <Text style={styles.priceUnit}> / {item.unit}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Écran Principal ───────────────────────────────────────────────────────────
export default function ProductsScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { products, isLoading, error } = useAppSelector((state) => state.products);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [categories, setCategories] = useState<CategoryConfig[]>([]);

  const loadProducts = useCallback((category = activeCategory, search = searchQuery) => {
    dispatch(fetchProducts({
      category: category === 'all' ? undefined : category,
      search: search.trim() || undefined,
    }));
  }, [dispatch, activeCategory, searchQuery]);

  useEffect(() => {
    dispatch(fetchProductCategories()).then((result) => {
      if (fetchProductCategories.fulfilled.match(result)) {
        setCategories(result.payload.map((category, index) => ({
          key: category.slug,
          label: category.name,
          ...CATEGORY_STYLES[index % CATEGORY_STYLES.length],
        })));
      }
    });
  }, [dispatch]);

  useEffect(() => {
    loadProducts();
  }, [activeCategory]);

  useEffect(() => {
    const timeout = setTimeout(() => loadProducts(), 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const categoryOptions = [ALL_CATEGORY, ...categories];
  const filteredProducts = products;

  const formatPrice = (amount: number) => {
    return `${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} F`;
  };

  // ─── États ───────────────────────────────────────────────────────────────────
  if (isLoading && products.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1D9E75" />
        <Text style={styles.loadingText}>Chargement du catalogue...</Text>
      </View>
    );
  }

  if (error && products.length === 0) {
    return (
      <View style={styles.center}>
        <AlertTriangle size={48} color="#EF4444" strokeWidth={1.5} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => loadProducts()}>
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <SafeAreaView edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Produits vivriers</Text>
            <Text style={styles.headerSubtitle}>
              {filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''} disponible{filteredProducts.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchBox}>
            <Search size={18} color="#94A3B8" strokeWidth={2.5} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un produit, une localité..."
              placeholderTextColor="#94A3B8"
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

        {/* Catégories horizontales */}
        <View style={styles.catWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catScroll}
          >
            {categoryOptions.map((cat) => {
              const isActive = activeCategory === cat.key;
              const Icon = cat.icon;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.catChip,
                    isActive && { backgroundColor: cat.color, borderColor: cat.color }
                  ]}
                  onPress={() => setActiveCategory(cat.key)}
                >
                  <Icon
                    size={14}
                    color={isActive ? '#FFF' : cat.color}
                    strokeWidth={2.5}
                  />
                  <Text style={[
                    styles.catChipText,
                    isActive && { color: '#FFF' }
                  ]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </SafeAreaView>

      {/* Liste */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadProducts} tintColor="#1D9E75" />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Package size={56} color="#CBD5E1" strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>
              {searchQuery || activeCategory !== 'all' ? 'Aucun résultat' : 'Catalogue vide'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery || activeCategory !== 'all'
                ? 'Essayez une autre recherche ou catégorie'
                : 'Aucun produit n\'est disponible pour le moment'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <ProductCard
            item={item}
            formatPrice={formatPrice}
            onPress={() => router.push({
              pathname: '/other/producer/productdetailScreen',
              params: { id: item.id }
            })}
          />
        )}
      />
    </View>
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
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 30, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 14, color: '#94A3B8', marginTop: 4, fontWeight: '500' },

  // Search
  searchWrapper: { paddingHorizontal: 24, marginBottom: 14 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
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

  // Catégories
  catWrapper: { marginBottom: 10 },
  catScroll: { paddingHorizontal: 24, gap: 10 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
    marginRight: 8,
  },
  catChipText: { fontSize: 13, fontWeight: '700', color: '#64748B' },

  // Liste
  listContent: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40 },

  // Carte
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
  },
  cardInner: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  imageBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  content: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  catBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  catText: { fontSize: 11, fontWeight: '700' },

  // Meta
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  dot: { fontSize: 13, color: '#CBD5E1' },

  // Vendeur
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  sellerText: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },

  // Prix
  priceRow: { flexDirection: 'row', alignItems: 'baseline' },
  price: { fontSize: 18, fontWeight: '800', color: '#1D9E75' },
  priceUnit: { fontSize: 14, fontWeight: '600', color: '#94A3B8' },

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
    lineHeight: 20,
  },
});