// src/pages/ProfilePage.tsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchResources } from '../store/resourcesSlice';
import { logout } from '../store/authSlice';
import { useNavigate } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const navigate = useNavigate();

  const { email, username, accessToken } = useSelector((state: RootState) => state.auth);
  const { wood, stone, gold, status } = useSelector((state: RootState) => state.resources);

  useEffect(() => {
    if (accessToken) {
      dispatch(fetchResources());
    }
  }, [accessToken, dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const goToGame = () => {
    navigate('/game'); // <- навигация на GameBoardPage
  };

  return (
    <div>
      <h2>Profile</h2>
      <p><strong>Username:</strong> {username}</p>
      <p><strong>Email:</strong> {email}</p>

      <h3>Resources</h3>
      {status === 'loading' ? (
        <p>Loading resources...</p>
      ) : (
        <ul>
          <li>Wood: {wood}</li>
          <li>Stone: {stone}</li>
          <li>Gold: {gold}</li>
        </ul>
      )}

      <button onClick={handleLogout}>Logout</button>
      <button onClick={goToGame} style={{ marginLeft: '10px' }}>Go to Game</button>
    </div>
  );
};