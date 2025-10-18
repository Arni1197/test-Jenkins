// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../store/authSlice';
import { RootState, AppDispatch } from '../store';
import { useNavigate } from 'react-router-dom';
import { forgotPassword } from '../store/authSlice';


export const LoginPage: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const navigate = useNavigate();
  const status = useSelector((state: RootState) => state.auth.status);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [resetEmail, setResetEmail] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);

  const handleForgotPassword = async () => {
    try {
      await dispatch(forgotPassword({ email: resetEmail })).unwrap();
      alert('Если email зарегистрирован, письмо отправлено.');
      setShowResetForm(false);
    } catch (err) {
      alert('Ошибка при отправке письма.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await dispatch(loginUser({ email, password })).unwrap();
      console.log('Logged in:', result);
      navigate('/profile');
    } catch (err) {
      alert('Login failed');
    }
  };

  return (
    <div>
      <div>
        <button type="button" onClick={() => setShowResetForm(true)}>Забыли пароль?</button>

        {showResetForm && (
          <div>
            <h3>Сброс пароля</h3>
            <input
              type="email"
              placeholder="Введите email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
            />
            <button type="button" onClick={handleForgotPassword}>Отправить</button>
            <button type="button" onClick={() => setShowResetForm(false)}>Отмена</button>
          </div>
        )}
      </div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        <button type="submit" disabled={status === 'loading'}>Login</button>
      </form>
    </div>
  );
};