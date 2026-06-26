import { createAsyncThunk } from '@reduxjs/toolkit';
import { RegisterInput } from "@/schemas/auth/registerFormSchema";
import api from '@/api/axiosConfig';

interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      name: string;
      phone: string;
      role: 'producer' | 'transporter' | 'buyer';
      status: string;
      created_at: string;
    };
    access_token: Record<string, any> | string;
    token_type: "bearer";
    expires_in: string;
  };
}

export const CreateUserAction = createAsyncThunk<
  RegisterResponse,       
  RegisterInput,          
  { rejectValue: string } 
>(
  'users/CreateUserAction',
  async (formData, { rejectWithValue }) => {
    console.log('[CreateUserAction] 📤 Requête POST /auth/register avec:', formData);

    try {
      const response = await api.post<RegisterResponse>('/auth/register', formData);

      console.log('[CreateUserAction] ✅ Réponse OK:', response.status, response.data);

      return response.data;
    } catch (error: any) {
      // Log complet pour debug
      console.log('[CreateUserAction] ❌ Erreur complète (objet):', error);
      console.log('[CreateUserAction] ❌ error.message:', error?.message);
      console.log('[CreateUserAction] ❌ Status HTTP:', error?.response?.status);
      console.log('[CreateUserAction] ❌ Headers réponse:', error?.response?.headers);
      console.log(
        '[CreateUserAction] ❌ Corps de la réponse backend (response.data):',
        JSON.stringify(error?.response?.data, null, 2)
      );
      console.log('[CreateUserAction] ❌ Config requête (url, baseURL, data envoyée):', {
        url: error?.config?.url,
        baseURL: error?.config?.baseURL,
        method: error?.config?.method,
        data: error?.config?.data,
      });

      // Si Laravel renvoie des erreurs de validation (422), elles sont
      // généralement dans error.response.data.errors (objet de tableaux)
      if (error?.response?.data?.errors) {
        console.log(
          '[CreateUserAction] ❌ Erreurs de validation Laravel (champ par champ):',
          JSON.stringify(error.response.data.errors, null, 2)
        );
      }

      // Si pas de réponse du tout -> souvent un problème réseau / mauvaise baseURL
      if (!error?.response) {
        console.log(
          '[CreateUserAction] ⚠️ Aucune réponse reçue du serveur. Vérifie: baseURL, connexion réseau, serveur Laravel lancé, CORS.'
        );
      }

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        (error.response?.data?.errors
          ? Object.values(error.response.data.errors).flat().join(' ')
          : null) ||
        "Une erreur est survenue lors de l'inscription.";

      return rejectWithValue(errorMessage);
    }
  }
);