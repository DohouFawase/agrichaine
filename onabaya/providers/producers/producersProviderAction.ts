import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/api/axiosConfig';

export interface ProductResource {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  total_estimated_value: number;
  location: string;
  status: string;
  category_id?: number | null;
  category?: string | null;
  category_details?: { id: number; name: string; slug: string } | null;
  created_at: string;
  producer?: {
    id: string;
    name: string;
    phone: string;
    role: string;
    status: string;
    created_at: string;
  };
}

export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
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

interface RNativeStoreProductInput {
  name: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  location: string;
  category_id?: number;
  stock_proof_photo: {
    uri: string;
    name: string;
    type: string;
  };
}

export const fetchProductCategories = createAsyncThunk<
  ProductCategory[],
  void,
  { rejectValue: string }
>('products/fetchCategories', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get<{ data: ProductCategory[] }>('/categories');
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Impossible de charger les catégories.');
  }
});

const getApiErrorMessage = (error: any) => {
  return (
    error.response?.data?.message ||
    error.response?.data?.errors?.name?.[0] ||
    error.response?.data?.errors?.quantity?.[0] ||
    error.response?.data?.errors?.unit?.[0] ||
    error.response?.data?.errors?.price_per_unit?.[0] ||
    error.response?.data?.errors?.location?.[0] ||
    error.response?.data?.errors?.category_id?.[0] ||
    error.response?.data?.errors?.stock_proof_photo?.[0] ||
    'Échec de la publication de la récolte.'
  );
};

export const fetchProducts = createAsyncThunk<
  ProductResource[],
  { search?: string; category?: string } | void,
  { rejectValue: string }
>('products/fetchAll', async (filters, { rejectWithValue }) => {
  try {
    const response = await api.get<ProductListResponse>('/products', {
      params: filters ?? {},
    });
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Impossible de charger les produits.');
  }
});

export const fetchProductDetails = createAsyncThunk<
  ProductResource,
  string,
  { rejectValue: string }
>('products/fetchDetails', async (productId, { rejectWithValue }) => {
  try {
    const response = await api.get<ProductDetailsResponse>(`products/${productId}`);
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Impossible de charger les détails du produit.');
  }
});

export const storeProductAction = createAsyncThunk<
  StoreProductResponse,
  RNativeStoreProductInput,
  { rejectValue: string }
>('products/storeProductAction', async (formData, { rejectWithValue }) => {
  try {
    const data = new FormData();
    data.append('name', formData.name);
    data.append('quantity', String(formData.quantity));
    data.append('unit', formData.unit);
    data.append('price_per_unit', String(formData.price_per_unit));
    data.append('location', formData.location);
    if (formData.category_id) data.append('category_id', String(formData.category_id));
    data.append('stock_proof_photo', {
      uri: formData.stock_proof_photo.uri,
      name: formData.stock_proof_photo.name,
      type: formData.stock_proof_photo.type,
    } as any);

    const response = await api.post<StoreProductResponse>('/products', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;
  } catch (error: any) {
    return rejectWithValue(getApiErrorMessage(error));
  }
});
