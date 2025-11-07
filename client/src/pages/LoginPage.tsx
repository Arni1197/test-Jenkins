import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, forgotPassword } from '../store/authSlice';
import { RootState, AppDispatch } from '../store';
import { useNavigate } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const navigate = useNavigate();
  const status = useSelector((state: RootState) => state.auth.status);
  const forgotStatus = useSelector((state: RootState) => state.auth.forgotStatus);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);

  const handleForgotPassword = async () => {
    try {
      await dispatch(forgotPassword({ email: resetEmail })).unwrap();
      alert('Если email зарегистрирован, письмо отправлено.');
      setShowResetForm(false);
    } catch {
      alert('Ошибка при отправке письма.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispatch(loginUser({ email, password })).unwrap();
      navigate('/profile');
    } catch {
      alert('Login failed');
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        <button type="submit" disabled={status === 'loading'}>Login</button>
      </form>

      <div style={{ marginTop: '20px' }}>
        <button onClick={() => setShowResetForm(true)}>Забыли пароль?</button>
        {showResetForm && (
          <div>
            <h3>Сброс пароля</h3>
            <input
              type="email"
              placeholder="Введите email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
            />
            <button onClick={handleForgotPassword} disabled={forgotStatus === 'loading'}>
              Отправить
            </button>
            <button onClick={() => setShowResetForm(false)}>Отмена</button>
          </div>
        )}
      </div>
    </div>
  );
};