// src/store/authSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

interface AuthState {
  email: string | null;
  username: string | null;
  status: 'idle' | 'loading' | 'failed';
  resources?: {
    wood: number;
    stone: number;
    gold: number;
  };
}

const initialState: AuthState = {
  email: null,
  username: null,
  status: 'idle',
  resources: { wood: 0, stone: 0, gold: 0 },
};

// ✅ Получить текущего пользователя (через cookie на сервере)
export const fetchUser = createAsyncThunk('auth/fetchUser', async () => {
  const res = await fetch('http://localhost:5001/auth/me', {
    method: 'GET',
    credentials: 'include', // важно, чтобы cookie ушли на сервер
  });
  if (!res.ok) throw new Error('Not authenticated');
  return res.json(); // { email, username, resources }
});

// thunk для запроса сброса пароля
export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (payload: { email: string }) => {
    const res = await fetch('http://localhost:5001/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to send reset email');
    return res.json(); // { message: 'Если email зарегистрирован, письмо отправлено.' }
  }
);

// thunk для логина
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (payload: { email: string; password: string }) => {
    const res = await fetch('http://localhost:5001/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // cookie будет установлена сервером
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Login failed');
    return res.json(); // { email, username, resources }
  }
);

// thunk для регистрации
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (payload: { email: string; password: string; username: string }) => {
    const res = await fetch('http://localhost:5001/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Register failed');
    return res.json(); // { email, username, resources }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.email = null;
      state.username = null;
      state.resources = { wood: 0, stone: 0, gold: 0 };
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchUser
      .addCase(fetchUser.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.status = 'idle';
        state.email = action.payload.email;
        state.username = action.payload.username;
        state.resources = action.payload.resources;
      })
      .addCase(fetchUser.rejected, (state) => { state.status = 'failed'; })

      // loginUser
      .addCase(loginUser.pending, (state) => { state.status = 'loading'; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'idle';
        state.email = action.payload.email;
        state.username = action.payload.username;
        state.resources = action.payload.resources;
      })
      .addCase(loginUser.rejected, (state) => { state.status = 'failed'; })

      // forgotPassword
      .addCase(forgotPassword.pending, (state) => { state.status = 'loading'; })
      .addCase(forgotPassword.fulfilled, (state) => { state.status = 'idle'; })
      .addCase(forgotPassword.rejected, (state) => { state.status = 'failed'; })

      // registerUser
      .addCase(registerUser.pending, (state) => { state.status = 'loading'; })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = 'idle';
        state.email = action.payload.email;
        state.username = action.payload.username;
        state.resources = action.payload.resources;
      })
      .addCase(registerUser.rejected, (state) => { state.status = 'failed'; });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;