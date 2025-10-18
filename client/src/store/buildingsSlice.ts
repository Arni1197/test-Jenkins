// src/store/buildingsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from './index';

interface Building {
  id: string;
  type: string;
  position: { x: number; y: number };
}

interface BuildingsState {
  items: Building[];
  status: 'idle' | 'loading' | 'failed';
}

const initialState: BuildingsState = {
  items: [],
  status: 'idle',
};

// thunk для получения зданий
export const fetchBuildings = createAsyncThunk<Building[], void, { state: RootState }>(
  'buildings/fetchBuildings',
  async (_, { getState }) => {
    const token = getState().auth.token;
    const res = await fetch('http://localhost:3000/buildings/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch buildings');
    return res.json();
  }
);

// thunk для создания здания
export const createBuilding = createAsyncThunk<Building, { type: string; x: number; y: number }, { state: RootState }>(
  'buildings/createBuilding',
  async ({ type, x, y }, { getState }) => {
    const token = getState().auth.token;
    const res = await fetch('http://localhost:3000/buildings/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      credentials: 'include',
      body: JSON.stringify({ type, x, y }),
    });
    if (!res.ok) throw new Error('Failed to create building');
    return res.json();
  }
);

const buildingsSlice = createSlice({
  name: 'buildings',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBuildings.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchBuildings.fulfilled, (state, action: PayloadAction<Building[]>) => {
        state.status = 'idle';
        state.items = action.payload;
      })
      .addCase(fetchBuildings.rejected, (state) => { state.status = 'failed'; })
      .addCase(createBuilding.fulfilled, (state, action: PayloadAction<Building>) => {
        state.items.push(action.payload);
      });
  },
});

export default buildingsSlice.reducer;