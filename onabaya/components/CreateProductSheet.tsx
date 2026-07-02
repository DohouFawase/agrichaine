import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Modal,
    Pressable,
    Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image, X } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { storeProductAction, ProductResource } from '@/providers/producers/producersProviderAction';
import { resetProductState, addProduct } from '@/slice/productsSlice';
import PublishProductModal from '@/components/Publishproductmodal';
import echo from '@/utils/echo';

interface SelectedPhoto {
    uri: string;
    name: string;
    type: string;
}

interface CreateProductSheetProps {
    visible: boolean;
    onClose: () => void;
}

export default function CreateProductSheet({ visible, onClose }: CreateProductSheetProps) {
    const dispatch = useAppDispatch();

    const { isLoading, isSuccess, error } = useAppSelector((state) => state.products);

    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [unit, setUnit] = useState('');
    const [pricePerUnit, setPricePerUnit] = useState('');
    const [location, setLocation] = useState('');
    const [photo, setPhoto] = useState<SelectedPhoto | null>(null);
    const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

    const [showPublishModal, setShowPublishModal] = useState(false);

    // Réinitialise le formulaire à chaque ouverture de la sheet
    const resetForm = () => {
        setName('');
        setQuantity('');
        setUnit('');
        setPricePerUnit('');
        setLocation('');
        setPhoto(null);
        setFormErrors({});
    };

    useEffect(() => {
        if (isSuccess) {
            Alert.alert("Succès", "Votre récolte a bien été publiée !");
            dispatch(resetProductState());
            resetForm();
            onClose();
        }
    }, [isSuccess, dispatch]);

    useEffect(() => {
        if (error) {
            Alert.alert("Erreur", error);
            dispatch(resetProductState());
        }
    }, [error, dispatch]);

   useEffect(() => {
    const channel = echo.channel('products');
    channel.listen('.product.created', (data: { data: ProductResource }) => {
        console.log('🟢 Nouveau produit reçu via Reverb :', data);
        dispatch(addProduct(data.data));
    });
    return () => {
        echo.leaveChannel('products');
    };
}, [dispatch]);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Permission refusée", "Accès aux photos requis.");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
            const selectedAsset = result.assets[0];
            const fileName = selectedAsset.fileName || `stock_${Date.now()}.jpg`;
            let fileType = 'image/jpeg';
            if (fileName.endsWith('.png')) fileType = 'image/png';
            if (fileName.endsWith('.webp')) fileType = 'image/webp';
            setPhoto({ uri: selectedAsset.uri, name: fileName, type: fileType });
            if (formErrors.photo) {
                setFormErrors(prev => { const { photo, ...rest } = prev; return rest; });
            }
        }
    };

    const validateForm = () => {
        const errors: { [key: string]: string } = {};
        if (!name.trim()) errors.name = "Le nom du produit est requis";
        if (!quantity.trim() || isNaN(Number(quantity)) || Number(quantity) <= 0)
            errors.quantity = "Quantité invalide";
        if (!unit.trim()) errors.unit = "L'unité est requise";
        if (!pricePerUnit.trim() || isNaN(Number(pricePerUnit)) || Number(pricePerUnit) < 1)
            errors.pricePerUnit = "Prix invalide";
        if (!location.trim()) errors.location = "La localisation est requise";
        if (!photo) errors.photo = "La photo est requise";
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSave = () => {
        if (!validateForm()) return;
        setShowPublishModal(true);
    };

    const handleConfirmPublish = () => {
        setShowPublishModal(false);
        dispatch(storeProductAction({
            name: name.trim(),
            quantity: Number(quantity),
            unit: unit.trim().toUpperCase(),
            price_per_unit: Math.floor(Number(pricePerUnit)),
            location: location.trim(),
            stock_proof_photo: photo!,
        }));
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={handleClose}
        >
            {/* Fond semi-transparent, cliquable pour fermer */}
            <Pressable style={styles.backdrop} onPress={handleClose} />

            <PublishProductModal
                visible={showPublishModal}
                productName={name.trim()}
                onConfirm={handleConfirmPublish}
                onCancel={() => setShowPublishModal(false)}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.sheetWrapper}
                pointerEvents="box-none"
            >
                <View style={styles.sheet}>
                    <View style={styles.sheetHandle} />

                    <View style={styles.sheetHeader}>
                        <Text style={styles.screenTitle}>Publier une récolte</Text>
                        <TouchableOpacity onPress={handleClose} hitSlop={10}>
                            <X size={22} color="#000000" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        contentContainerStyle={styles.scrollContainer}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Nom du produit</Text>
                            <TextInput
                                style={[styles.input, formErrors.name && styles.inputError]}
                                placeholder="Ex: MANIOC"
                                placeholderTextColor="#A0A0A0"
                                value={name}
                                onChangeText={setName}
                            />
                            {formErrors.name && <Text style={styles.errorText}>{formErrors.name}</Text>}
                        </View>

                        <View style={styles.rowInputs}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                                <Text style={styles.label}>Quantité</Text>
                                <TextInput
                                    style={[styles.input, formErrors.quantity && styles.inputError]}
                                    placeholder="12"
                                    placeholderTextColor="#A0A0A0"
                                    keyboardType="numeric"
                                    value={quantity}
                                    onChangeText={setQuantity}
                                />
                                {formErrors.quantity && <Text style={styles.errorText}>{formErrors.quantity}</Text>}
                            </View>
                            <View style={[styles.inputGroup, { flex: 1.2 }]}>
                                <Text style={styles.label}>Unité</Text>
                                <TextInput
                                    style={[styles.input, formErrors.unit && styles.inputError]}
                                    placeholder="KG/SAC"
                                    placeholderTextColor="#A0A0A0"
                                    autoCapitalize="characters"
                                    value={unit}
                                    onChangeText={setUnit}
                                />
                                {formErrors.unit && <Text style={styles.errorText}>{formErrors.unit}</Text>}
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Prix par unité (FCFA)</Text>
                            <TextInput
                                style={[styles.input, formErrors.pricePerUnit && styles.inputError]}
                                placeholder="4 500"
                                placeholderTextColor="#A0A0A0"
                                keyboardType="number-pad"
                                value={pricePerUnit}
                                onChangeText={setPricePerUnit}
                            />
                            {formErrors.pricePerUnit && <Text style={styles.errorText}>{formErrors.pricePerUnit}</Text>}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Localisation</Text>
                            <TextInput
                                style={[styles.input, formErrors.location && styles.inputError]}
                                placeholder="PARAKOU, Bénin"
                                placeholderTextColor="#A0A0A0"
                                value={location}
                                onChangeText={setLocation}
                            />
                            {formErrors.location && <Text style={styles.errorText}>{formErrors.location}</Text>}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Preuve photo du stock</Text>
                            <TouchableOpacity
                                activeOpacity={0.7}
                                style={[styles.photoPickerZone, formErrors.photo && styles.photoZoneError]}
                                onPress={pickImage}
                            >
                                <Image size={28} color="#000000" style={styles.photoIcon} />
                                <Text style={styles.photoText}>
                                    {photo ? `✓ Photo ajoutée` : 'Ajouter une photo'}
                                </Text>
                            </TouchableOpacity>
                            {formErrors.photo && <Text style={styles.errorText}>{formErrors.photo}</Text>}
                        </View>

                        <TouchableOpacity
                            activeOpacity={0.9}
                            style={styles.submitButton}
                            onPress={handleSave}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.submitButtonText}>Publier le produit</Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const SHEET_MAX_HEIGHT = Dimensions.get('window').height * 0.9;

const styles = StyleSheet.create({
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
    errorText: { color: '#E53935', fontSize: 12, marginTop: 4, fontWeight: '500' },
    photoPickerZone: { backgroundColor: '#F9F8F6', borderWidth: 1, borderColor: '#000000', borderStyle: 'dashed', borderRadius: 14, height: 120, justifyContent: 'center', alignItems: 'center' },
    photoZoneError: { borderColor: '#E53935', backgroundColor: '#FFEBEE' },
    photoIcon: { marginBottom: 8, opacity: 0.8 },
    photoText: { fontSize: 14, color: '#000000', fontWeight: '500' },
    submitButton: { backgroundColor: '#1D9E75', height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
    submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});