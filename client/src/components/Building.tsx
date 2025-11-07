import React from 'react';

interface BuildingProps {
  type: string;
}

export const Building: React.FC<BuildingProps> = ({ type }) => {
  return <span>{type}</span>;
};