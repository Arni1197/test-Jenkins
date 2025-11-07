import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { resetPassword } from '../store/authSlice';
import { AppDispatch, RootState } from '../store';
import { useSearchParams, useNavigate } from 'react-router-dom';

export const ResetPasswordPage: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const resetStatus = useSelector((state: RootState) => state.auth.resetStatus);
  const [password, setPassword] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) navigate('/forgot-password');
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      await dispatch(resetPassword({ token, password })).unwrap();
      alert('Пароль успешно сброшен.');
      navigate('/login');
    } catch {
      alert('Ошибка при сбросе пароля.');
    }
  };

  return (
    <div>
      <h2>Новый пароль</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Введите новый пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={resetStatus === 'loading'}>
          Сбросить пароль
        </button>
      </form>
    </div>
  );
};