import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/api/axiosConfig';
import { UserRole } from '@/types/users/userType';

export interface UserResource {
  id: string;
  name: string;
  last_name: string;
  phone: string;
  email: string;
  role: UserRole;
  status: string;
  average_rating: string;
  identity_document_path: string | null;
  id_verified_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// Action pour récupérer l'utilisateur actuellement connecté
export const fetchCurrentUserAction = createAsyncThunk<
  UserResource,
  void,
  { rejectValue: string }
>('auth/fetchCurrentUser', async (_, { rejectWithValue }) => {
  try {
    // Appel sur la route GET /v1/user définie dans l'OpenAPI
    const response = await api.get<UserResource>('/v1/user');
    return response.data;
  } catch (error: any) {
    const msg = error.response?.data?.message || "Impossible de récupérer le profil.";
    return rejectWithValue(msg);
  }
});