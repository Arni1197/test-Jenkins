// src/store/resourcesSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from './index';

interface ResourcesState {
  wood: number;
  stone: number;
  gold: number;
  status: 'idle' | 'loading' | 'failed';
}

const initialState: ResourcesState = {
  wood: 0,
  stone: 0,
  gold: 0,
  status: 'idle',
};

// Базовый URL бэкенда
const API = process.env.REACT_APP_API_URL || 'http://localhost:30080';

// Общий helper для заголовков с Bearer
const buildHeaders = (getState: () => RootState): Record<string, string> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const accessToken = getState().auth.accessToken;
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  return headers;
};

// ✅ Получить ресурсы текущего пользователя
export const fetchResources = createAsyncThunk<
  { wood: number; stone: number; gold: number },
  void,
  { state: RootState }
>(
  'resources/fetchResources',
  async (_, { getState, rejectWithValue }) => {
    const res = await fetch(`${API}/resources/me`, {
      method: 'GET',
      headers: buildHeaders(getState),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return rejectWithValue(body?.message || `HTTP ${res.status}`);
    }

    return res.json();
  }
);

const resourcesSlice = createSlice({
  name: 'resources',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchResources.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchResources.fulfilled, (state, action) => {
        state.status = 'idle';
        state.wood = action.payload.wood;
        state.stone = action.payload.stone;
        state.gold = action.payload.gold;
      })
      .addCase(fetchResources.rejected, (state) => { state.status = 'failed'; });
  },
});

export default resourcesSlice.reducer;