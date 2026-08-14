import React from 'react';
import { useApp } from '../../context/AppContext';
import { ManufacturerQuoteSubmissionsModule } from './ManufacturerQuoteSubmissionsModule';
import { BuyerQuoteComparisonModule } from './BuyerQuoteComparisonModule';

export const QuoteModule: React.FC = () => {
  const { currentRole } = useApp();

  if (currentRole === 'SUPPLIER') {
    return <ManufacturerQuoteSubmissionsModule />;
  }

  return <BuyerQuoteComparisonModule />;
};
