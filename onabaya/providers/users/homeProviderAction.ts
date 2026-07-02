import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/api/axiosConfig';
import { HomeResponse } from '@/types/home/homeType';

// ─── Fetch Home (dispatch unique, rôle géré côté backend) ────────────────────

export const fetchHome = createAsyncThunk<
  HomeResponse,
  void,
  { rejectValue: string }
>(
  'home/fetchHome',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<HomeResponse>('/home');
      return response.data;
    } catch (error: any) {
      const message =
        error?.response?.data?.message ?? 'Erreur lors du chargement du home.';
      return rejectWithValue(message);
    }
  }
);