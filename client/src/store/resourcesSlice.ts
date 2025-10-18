// src/store/resourcesSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from './index';

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

// thunk для получения ресурсов текущего пользователя
export const fetchResources = createAsyncThunk<
  { wood: number; stone: number; gold: number },
  void,
  { state: RootState }
>(
  'resources/fetchResources',
  async (_, { getState }) => {
    const token = getState().auth.token;
    if (!token) throw new Error('No token');

    const res = await fetch('http://localhost:3000/resources/me', {
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch resources');
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