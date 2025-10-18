import React from 'react';
import { useNavigate } from 'react-router-dom';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>новая ветка</h1>
      <p>Выберите действие:</p>
      <button style={{ margin: '10px' }} onClick={() => navigate('/login')}>
        Войти
      </button>
      <button style={{ margin: '10px' }} onClick={() => navigate('/register')}>
        Зарегистрироваться
      </button>
    </div>
  );
};