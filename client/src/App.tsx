import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from './store';
import { fetchUser } from './store/authSlice';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProfilePage } from './pages/ProfilePage';
import { GameBoardPage } from './pages/GameBoardPage';
import { HomePage } from './pages/HomePage';

const App: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const email = useSelector((state: RootState) => state.auth.email);
  const status = useSelector((state: RootState) => state.auth.status);

  useEffect(() => {
    dispatch(fetchUser()).catch(() => {}); // пробуем получить юзера через cookie
  }, [dispatch]);

  const isAuthenticated = !!email;

  if (status === 'loading') return <div>Loading...</div>;

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/profile" /> : <HomePage />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/profile" /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/profile" /> : <RegisterPage />} />
      <Route path="/profile" element={isAuthenticated ? <ProfilePage /> : <Navigate to="/login" />} />
      <Route path="/game" element={isAuthenticated ? <GameBoardPage /> : <Navigate to="/login" />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;