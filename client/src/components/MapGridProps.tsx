import React from 'react';

interface MapGridProps {
  width: number;
  height: number;
  children: React.ReactNode[][];
}

export const MapGrid: React.FC<MapGridProps> = ({ width, height, children }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${width}, 50px)` }}>
      {children.flat()}
    </div>
  );
};