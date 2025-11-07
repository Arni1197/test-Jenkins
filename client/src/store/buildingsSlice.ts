import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

// ✅ Базовый URL
const API = process.env.REACT_APP_API_URL || 'http://localhost:30080';

// ✅ Helper для заголовков с токеном
const buildHeaders = (getState: () => any): Record<string, string> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const accessToken: string | null = getState().auth.accessToken;
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  return headers;
};

export interface Building {
  _id: string;
  type: string;
  level: number;
  // ✅ добавили координаты
  position: {
    x: number;
    y: number;
  };
}

interface BuildingsState {
  items: Building[];
  status: 'idle' | 'loading' | 'failed';
}

const initialState: BuildingsState = {
  items: [],
  status: 'idle',
};

// ✅ Получить здания пользователя
export const fetchBuildings = createAsyncThunk(
  'buildings/fetchBuildings',
  async (_, { getState, rejectWithValue }) => {
    const res = await fetch(`${API}/buildings/me`, {
      method: 'GET',
      headers: buildHeaders(getState as any),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return rejectWithValue(body?.message || `HTTP ${res.status}`);
    }
    return res.json(); // ожидается массив { _id, type, level, position:{x,y} }
  }
);

// ✅ Создать новое здание (теперь с координатами)
export const createBuilding = createAsyncThunk(
  'buildings/createBuilding',
  async (payload: { type: string; x: number; y: number }, { getState, rejectWithValue }) => {
    const res = await fetch(`${API}/buildings/create`, {
      method: 'POST',
      headers: buildHeaders(getState as any),
      body: JSON.stringify(payload), // { type, x, y }
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return rejectWithValue(body?.message || `HTTP ${res.status}`);
    }
    return res.json(); // новое здание того же формата (с position)
  }
);

const buildingsSlice = createSlice({
  name: 'buildings',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBuildings.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchBuildings.fulfilled, (state, action) => {
        state.status = 'idle';
        state.items = action.payload;
      })
      .addCase(fetchBuildings.rejected, (state) => { state.status = 'failed'; })
      .addCase(createBuilding.pending, (state) => { state.status = 'loading'; })
      .addCase(createBuilding.fulfilled, (state, action) => {
        state.status = 'idle';
        state.items.push(action.payload); // { _id,type,level,position:{x,y} }
      })
      .addCase(createBuilding.rejected, (state) => { state.status = 'failed'; });
  },
});

export default buildingsSlice.reducer;