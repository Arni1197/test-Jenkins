// src/store/authSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_BASE = process.env.REACT_APP_API_URL ?? 'http://localhost:5001';
const API = `${API_BASE}/api`;

interface Resources {
  wood: number;
  stone: number;
  gold: number;
}

interface AuthState {
  email: string | null;
  username: string | null;
  status: 'idle' | 'loading' | 'failed';
  forgotStatus: 'idle' | 'loading' | 'failed';
  resetStatus: 'idle' | 'loading' | 'failed';
  resources?: Resources;
}

const initialState: AuthState = {
  email: null,
  username: null,
  status: 'idle',
  forgotStatus: 'idle',
  resetStatus: 'idle',
  resources: { wood: 0, stone: 0, gold: 0 },
};

// Хелпер для fetch с cookie
const json = (method: string, body?: any) => ({
  method,
  credentials: 'include' as const,
  headers: { 'Content-Type': 'application/json' },
  ...(body ? { body: JSON.stringify(body) } : {}),
});

// ------------------- Thunks -------------------

// Регистрация
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (payload: { email: string; password: string; username: string }, { rejectWithValue }) => {
    const res = await fetch(`${API}/auth/register`, json('POST', payload));
    if (!res.ok) return rejectWithValue(await res.json());
    return res.json();
  }
);

// Логин
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (payload: { email: string; password: string }, { rejectWithValue }) => {
    const res = await fetch(`${API}/auth/login`, json('POST', payload));
    if (!res.ok) return rejectWithValue(await res.json());
    return res.json();
  }
);

// Сброс пароля (запрос)
export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (payload: { email: string }, { rejectWithValue }) => {
    const res = await fetch(`${API}/auth/forgot-password`, json('POST', payload));
    if (!res.ok) return rejectWithValue(await res.json());
    return res.json();
  }
);

// Сброс пароля (установка нового)
export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (payload: { token: string; password: string }, { rejectWithValue }) => {
    const res = await fetch(`${API}/auth/reset-password`, json('POST', payload));
    if (!res.ok) return rejectWithValue(await res.json());
    return res.json();
  }
);

// Выход
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    const res = await fetch(`${API}/auth/logout`, json('POST'));
    if (!res.ok) return rejectWithValue(await res.json());
    return res.json();
  }
);

// Получение данных пользователя (сессия)
export const fetchUser = createAsyncThunk(
  'auth/fetchUser',
  async (_, { rejectWithValue }) => {
    const res = await fetch(`${API}/auth/me`, json('GET'));
    if (!res.ok) return rejectWithValue(await res.json());
    return res.json();
  }
);

// ------------------- Slice -------------------
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // register
      .addCase(registerUser.pending, (s) => { s.status = 'loading'; })
      .addCase(registerUser.fulfilled, (s, a) => { s.status = 'idle'; s.email = a.payload.email; s.username = a.payload.username; })
      .addCase(registerUser.rejected, (s) => { s.status = 'failed'; })

      // login
      .addCase(loginUser.pending, (s) => { s.status = 'loading'; })
      .addCase(loginUser.fulfilled, (s, a) => { s.status = 'idle'; s.email = a.payload.email; s.username = a.payload.username; })
      .addCase(loginUser.rejected, (s) => { s.status = 'failed'; })

      // forgot password
      .addCase(forgotPassword.pending, (s) => { s.forgotStatus = 'loading'; })
      .addCase(forgotPassword.fulfilled, (s) => { s.forgotStatus = 'idle'; })
      .addCase(forgotPassword.rejected, (s) => { s.forgotStatus = 'failed'; })

      // reset password
      .addCase(resetPassword.pending, (s) => { s.resetStatus = 'loading'; })
      .addCase(resetPassword.fulfilled, (s) => { s.resetStatus = 'idle'; })
      .addCase(resetPassword.rejected, (s) => { s.resetStatus = 'failed'; })

      // fetch user
      .addCase(fetchUser.pending, (s) => { s.status = 'loading'; })
      .addCase(fetchUser.fulfilled, (s, a) => {
        s.status = 'idle';
        s.email = a.payload.email ?? s.email;
        s.username = a.payload.username ?? s.username;
      })
      .addCase(fetchUser.rejected, (s) => { s.status = 'failed'; })

      // logout
      .addCase(logoutUser.fulfilled, (s) => {
        s.email = null;
        s.username = null;
        s.resources = { wood: 0, stone: 0, gold: 0 };
        s.status = 'idle';
      });
  },
});

export default authSlice.reducer;


