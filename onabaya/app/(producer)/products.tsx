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
    Alert,
   
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Search, Package, Image as ImageIcon, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { fetchProducts, ProductResource } from '@/providers/producers/producersProviderAction';
import { resetProductState, addProduct } from '@/slice/productsSlice';
import CreateProductSheet from '@/components/CreateProductSheet';



const SHEET_MAX_HEIGHT = Dimensions.get('window').height * 0.9;

export default function ProductsScreen() {
    const router = useRouter();
    const dispatch = useAppDispatch();

    // Récupération des données du Slice Redux
    const { products, isLoading, isSuccess, error } = useAppSelector((state) => state.products);
 const [isCreateSheetVisible, setIsCreateSheetVisible] = useState(false);
    // État local pour la barre de recherche
    const [searchQuery, setSearchQuery] = useState('');

 
    // Fonction pour charger ou rafraîchir les produits
    const loadProducts = useCallback(() => {
        dispatch(fetchProducts());
    }, [dispatch]);

    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    // Écoute Reverb pour les nouveaux produits créés en temps réel
  

    
    // Réaction à une erreur de création
    useEffect(() => {
        if (error) {
            Alert.alert("Erreur", error);
            dispatch(resetProductState());
        }
    }, [error, dispatch]);

    // Filtrage local des produits selon la recherche
    const filteredProducts = products.filter((product: ProductResource) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Formateur pour le prix (ex: 4 500 F)
    const formatPrice = (amount: number) => {
        return `${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} F`;
    };

 


    // Composant pour chaque ligne de produit
    const renderProductItem = ({ item }: { item: ProductResource }) => (
        <TouchableOpacity
            activeOpacity={0.7}
            style={styles.productCard}
            onPress={() => router.push({
                pathname: '/other/producer/productdetailScreen',
                params: { id: item.id }
            })}
        >
            {/* Carré d'illustration vert clair de ta maquette */}
            <View style={styles.imagePlaceholder}>
                <Package size={24} color="#1D9E75" opacity={0.6} />
            </View>

            <View style={styles.productDetails}>
                <View style={styles.productHeader}>
                    <Text style={styles.productName}>{item.name}</Text>
                    <Text style={styles.productStatus}>{item.status === 'active' ? 'Disponible' : item.status}</Text>
                </View>
                <Text style={styles.productQuantity}>
                    {item.quantity} {item.unit} • {item.location}
                </Text>
                <Text style={styles.productPrice}>
                    {formatPrice(item.price_per_unit)} / {item.unit}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            <SafeAreaView edges={['top']}>
                {/* En-tête : Titre + Bouton vert Plus de ta maquette */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Mes produits</Text>

                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.addButton}
                        // onPress={openCreateSheet}
                        onPress={() => setIsCreateSheetVisible(true)} 
                    >
                        <Plus size={24} color="#FFFFFF" strokeWidth={2.5} />
                    </TouchableOpacity>

                </View>

                {/* Barre de recherche intégrée */}
                <View style={styles.searchContainer}>
                    <Search size={20} color="#A0A0A0" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Rechercher..."
                        placeholderTextColor="#A0A0A0"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </SafeAreaView>

            {/* Gestion des différents états d'affichage (Loader, Erreur, Liste vide) */}
            {isLoading && products.length === 0 ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#1D9E75" />
                </View>
            ) : error ? (
                <View style={styles.centerContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={loadProducts}>
                        <Text style={styles.retryText}>Réessayer</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={filteredProducts}
                    keyExtractor={(item) => item.id}
                    renderItem={renderProductItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={isLoading} onRefresh={loadProducts} tintColor="#1D9E75" />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>
                                {searchQuery ? 'Aucun résultat trouvé.' : 'Aucune récolte publiée pour le moment.'}
                            </Text>
                        </View>
                    }
                />
            )}

           <CreateProductSheet
                visible={isCreateSheetVisible}
                onClose={() => setIsCreateSheetVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF', paddingTop: 26 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, marginBottom: 20 },
    headerTitle: { fontSize: 24, fontWeight: '700', color: '#000000' },
    addButton: { backgroundColor: '#1D9E75', width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', marginHorizontal: 24, height: 48, borderRadius: 14, paddingHorizontal: 16, marginBottom: 12 },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, fontSize: 15, color: '#000000', fontWeight: '500' },
    listContent: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 100 },
    productCard: { flexDirection: 'row', backgroundColor: '#F9F8F6', borderRadius: 16, padding: 14, marginBottom: 14, alignItems: 'center' },
    imagePlaceholder: { width: 54, height: 54, backgroundColor: '#EBF4E0', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    productDetails: { flex: 1, marginLeft: 14, gap: 2 },
    productHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    productName: { fontSize: 16, fontWeight: '700', color: '#000000' },
    productStatus: { fontSize: 11, fontWeight: '700', color: '#1D9E75', textTransform: 'uppercase' },
    productQuantity: { fontSize: 13, color: '#666666', fontWeight: '500' },
    productPrice: { fontSize: 14, fontWeight: '700', color: '#1D9E75', marginTop: 2 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
    errorText: { color: '#D32F2F', textAlign: 'center', fontSize: 14, marginBottom: 16 },
    retryButton: { backgroundColor: '#1D9E75', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
    retryText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
    emptyContainer: { alignItems: 'center', paddingTop: 60 },
    emptyText: { color: '#A0A0A0', fontSize: 14, fontStyle: 'italic', textAlign: 'center' },

    // --- Styles de la sheet de création (fusionnés depuis CreateProductSheet) ---
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    sheetWrapper: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: SHEET_MAX_HEIGHT,
        paddingTop: 10,
    },
    sheetHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#E0E0E0',
        alignSelf: 'center',
        marginBottom: 10,
    },
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 8,
    },
    scrollContainer: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },
    screenTitle: { fontSize: 20, fontWeight: '700', color: '#000000' },
    inputGroup: { marginBottom: 20 },
    rowInputs: { flexDirection: 'row', justifyContent: 'space-between' },
    label: { fontSize: 14, fontWeight: '600', color: '#000000', marginBottom: 10 },
    input: { backgroundColor: '#F9F8F6', height: 54, borderRadius: 14, paddingHorizontal: 16, fontSize: 15, color: '#000000', fontWeight: '500' },
    inputError: { borderWidth: 1, borderColor: '#E53935' },
    photoPickerZone: { backgroundColor: '#F9F8F6', borderWidth: 1, borderColor: '#000000', borderStyle: 'dashed', borderRadius: 14, height: 120, justifyContent: 'center', alignItems: 'center' },
    photoZoneError: { borderColor: '#E53935', backgroundColor: '#FFEBEE' },
    photoIcon: { marginBottom: 8, opacity: 0.8 },
    photoText: { fontSize: 14, color: '#000000', fontWeight: '500' },
    submitButton: { backgroundColor: '#1D9E75', height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
    submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});