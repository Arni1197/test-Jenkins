// src/components/Tile.tsx
import React from 'react';

interface TileProps {
  x: number;
  y: number;
  onClick?: () => void;
  children?: React.ReactNode;
}

export const Tile: React.FC<TileProps> = ({ x, y, onClick, children }) => {
  return (
    <div
      onClick={onClick}
      style={{
        width: 50,
        height: 50,
        border: '1px solid gray',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {children}
    </div>
  );
};

// src/components/MapGrid.tsx


