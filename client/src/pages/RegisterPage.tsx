// src/pages/RegisterPage.tsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, fetchUser } from '../store/authSlice';
import { RootState, AppDispatch } from '../store';
import { useNavigate } from 'react-router-dom';

export const RegisterPage: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const navigate = useNavigate();
  const status = useSelector((state: RootState) => state.auth.status);

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // регистрация
      await dispatch(registerUser({ email, username, password })).unwrap();

      // запрос информации о текущем пользователе через HttpOnly cookie
      await dispatch(fetchUser()).unwrap();

      navigate('/profile'); // теперь безопасно редиректим
    } catch (err) {
      alert('Register failed');
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
};