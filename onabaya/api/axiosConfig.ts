/* eslint-disable import/no-named-as-default-member */
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to inject a JWT token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Add a response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Logic for handling unauthorized errors (e.g., redirect to login)
    }
    return Promise.reject(error);
  },
);

export default api;
