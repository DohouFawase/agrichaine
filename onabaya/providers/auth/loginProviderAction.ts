import { createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/api/axiosConfig';
import { LoginInput } from "@/schemas/auth/loginFormSchema";

// On exporte l'interface pour qu'elle soit accessible dans ton LoginScreen
export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      name: string;
      phone: string;
      role: string;
      status: string;
      created_at: string;
    };
    access_token: string; 
    token_type: "bearer";
    expires_in: number;
  };
}

export const LoginUserAction = createAsyncThunk<
  LoginResponse,          
  LoginInput,            
  { rejectValue: string } 
>(
  'auth/loginUserAction',
  async (credentials, { rejectWithValue }) => {
    try {
      console.log('[Thunk] Envoi des identifiants à l\'API...', credentials.phone);
      
      const response = await api.post<LoginResponse>('/auth/login', credentials);
      
      // Log de la réponse brute reçue du serveur
      console.log('[Thunk] Réponse API reçue:', JSON.stringify(response.data, null, 2));

      const { access_token, user } = response.data.data;

      if (access_token) {
        await AsyncStorage.setItem('token', access_token);
        console.log('[Thunk] Token sauvegardé avec succès dans le stockage local.');
      }

      console.log(`[Thunk] Connexion réussie pour l'utilisateur: ${user.name} (Rôle: ${user.role})`);
      return response.data;
      
    } catch (error: any) {
      console.error('[Thunk] Erreur lors de la requête de connexion:', error);
      
      const errorMessage = error.response?.data?.message || "Impossible de se connecter. Veuillez réessayer.";
      return rejectWithValue(errorMessage);
    }
  }
);