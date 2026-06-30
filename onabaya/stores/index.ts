import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/slice/authSlice'; 
import productsReducer from '@/slice/productsSlice';
import walletReducer from '@/slice/walletSlice'
import ordersReducer from '@/slice/orderSlice'
import mapsReducer from '@/slice/mapSlice'
export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productsReducer,
    wallet: walletReducer,
    maps: mapsReducer,
    orders: ordersReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, 
    }),
});

// Typages indispensables pour TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;