// src/pages/GameBoardPage.tsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchBuildings, createBuilding } from '../store/buildingsSlice';
import { Tile } from '../components/Tile';
import { Building } from '../components/Building';
import { MapGrid } from '../components/MapGridProps';
import { ResourcePanel } from '../components/ResourcePanel';

export const GameBoardPage: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const { items: buildings, status } = useSelector((state: RootState) => state.buildings);
  const width = 5;
  const height = 5;

  const [selectedType, setSelectedType] = useState('House');

  useEffect(() => {
    dispatch(fetchBuildings());
  }, [dispatch]);

  const handleTileClick = (x: number, y: number) => {
    dispatch(createBuilding({ type: selectedType, x, y }));
  };

  // создаём матрицу клеток
  const grid: React.ReactNode[][] = [];
  for (let y = 0; y < height; y++) {
    const row: React.ReactNode[] = [];
    for (let x = 0; x < width; x++) {
      const building = buildings.find((b) => b.position.x === x && b.position.y === y);
      row.push(
        <Tile key={`${x}-${y}`} x={x} y={y} onClick={() => handleTileClick(x, y)}>
          {building && <Building type={building.type} />}
        </Tile>
      );
    }
    grid.push(row);
  }

  return (
    <div>
      <h2>Game Board</h2>
      <p>Ресурсы</p>
      <p><ResourcePanel></ResourcePanel></p>
      <label>
        Select building type:
        <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
          <option value="House">House</option>
          <option value="Farm">Farm</option>
          <option value="Barracks">Barracks</option>
        </select>
      </label>
      {status === 'loading' ? <p>Loading buildings...</p> : <MapGrid width={width} height={height} children={grid} />}
    </div>
  );
};