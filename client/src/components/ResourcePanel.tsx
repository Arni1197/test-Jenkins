import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

export const ResourcePanel: React.FC = () => {
  const resources = useSelector((state: RootState) => state.auth.resources);

  if (!resources) return <div>Загрузка ресурсов...</div>;

  return (
    <div style={{ display: 'flex', gap: '20px', padding: '10px', border: '1px solid #ccc' }}>
      <div>🪵 Wood: {resources.wood}</div>
      <div>🪨 Stone: {resources.stone}</div>
      <div>💰 Gold: {resources.gold}</div>
    </div>
  );
};