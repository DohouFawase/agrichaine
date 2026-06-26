import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/api/axiosConfig';

// 🛡️ Typage complet et ultra-fidèle à la ressource ProductResource de document(1).json
export interface ProductResource {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  total_estimated_value: number; // ✨ Ajouté (calculé automatiquement par le backend)
  location: string;
  status: string;
  created_at: string;
  producer?: {                   // ✨ Ajouté (charge le producteur connecté)
    id: string;
    name: string;
    phone: string;
    role: string;
    status: string;
    created_at: string;
  };
}

interface ProductListResponse {
  success: boolean;
  data: ProductResource[];
}

interface ProductDetailsResponse {
  success: boolean;
  data: ProductResource;
}

interface StoreProductResponse {
  success: boolean;
  message: string;
  data: ProductResource;
}


interface StoreProductResponse {
  success: boolean;
  message: string;
  data: ProductResource;
}

interface RNativeStoreProductInput {
  name: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  location: string;
  stock_proof_photo: {
    uri: string;
    name: string;
    type: string;
  };
}


// 1. Action pour récupérer tous les produits (Catalogue)
export const fetchProducts = createAsyncThunk<
  ProductResource[],
  void,
  { rejectValue: string }
>('products/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get<ProductListResponse>('/products');
    return response.data.data;
  } catch (error: any) {
    const msg = error.response?.data?.message || "Impossible de charger les produits.";
    return rejectWithValue(msg);
  }
});

// 2. Action pour voir les détails d'un produit
export const fetchProductDetails = createAsyncThunk<
  ProductResource,
  string,
  { rejectValue: string }
>('products/fetchDetails', async (productId, { rejectWithValue }) => {
  try {
    const response = await api.get<ProductDetailsResponse>(`/v1/products/${productId}`);
    return response.data.data;
  } catch (error: any) {
    const msg = error.response?.data?.message || "Impossible de charger les détails du produit.";
    return rejectWithValue(msg);
  }
});


export const StoreProductAction = createAsyncThunk<
  StoreProductResponse,
  RNativeStoreProductInput,
  { rejectValue: string }
>(
  'products/storeProductAction',
  async (formData, { rejectWithValue }) => {
    try {
      // 1. Instanciation du FormData natif pour l'upload de fichiers
      const data = new FormData();

      // 2. Injection des champs textuels/numériques
      data.append('name', formData.name);
      data.append('quantity', String(formData.quantity));
      data.append('unit', formData.unit);
      data.append('price_per_unit', String(formData.price_per_unit));
      data.append('location', formData.location);

      // 3. Injection sécurisée du fichier pour le système d'upload de React Native
      if (formData.stock_proof_photo && formData.stock_proof_photo.uri) {
        data.append('stock_proof_photo', {
          uri: formData.stock_proof_photo.uri,
          name: formData.stock_proof_photo.name,
          type: formData.stock_proof_photo.type,
        } as any);
      }

      // 4. Envoi avec le bon préfixe de version /v1/ conforme à la spec OpenAPI
      const response = await api.post<StoreProductResponse>('/v1/products', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error: any) {
      // Extraction fine des erreurs de validation (ex: "Le champ prix est obligatoire")
      const errorMessage = 
        error.response?.data?.message || 
        error.response?.data?.errors?.name?.[0] || 
        "Échec de la publication de la récolte.";
      return rejectWithValue(errorMessage);
    }
  }
);