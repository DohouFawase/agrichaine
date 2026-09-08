import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/api/axiosConfig';

interface VerifyOtpPayload {
  email: string;
  code: string;
}

interface VerificationResponse {
  success: boolean;
  message: string;
}

export const verifyEmailOtpAction = createAsyncThunk<
  VerificationResponse,
  VerifyOtpPayload,
  { rejectValue: string }
>('auth/verifyEmailOtp', async (payload, { rejectWithValue }) => {
  try {
    const response = await api.post<VerificationResponse>('/auth/email/verify-otp', payload);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Code de vérification invalide.');
  }
});

export const resendEmailOtpAction = createAsyncThunk<
  VerificationResponse,
  string,
  { rejectValue: string }
>('auth/resendEmailOtp', async (email, { rejectWithValue }) => {
  try {
    const response = await api.post<VerificationResponse>('/auth/email/resend', { email });
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Impossible de renvoyer le code.');
  }
});
