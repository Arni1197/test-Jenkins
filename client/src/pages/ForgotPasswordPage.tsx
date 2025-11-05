import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { forgotPassword } from '../store/authSlice';
import { AppDispatch, RootState } from '../store';

export const ForgotPasswordPage: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const forgotStatus = useSelector((state: RootState) => state.auth.forgotStatus);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispatch(forgotPassword({ email })).unwrap();
      alert('Если email зарегистрирован, письмо отправлено.');
      setEmail('');
    } catch {
      alert('Ошибка при отправке письма.');
    }
  };

  return (
    <div>
      <h2>Сброс пароля</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Введите email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit" disabled={forgotStatus === 'loading'}>
          Отправить ссылку
        </button>
      </form>
    </div>
  );
};