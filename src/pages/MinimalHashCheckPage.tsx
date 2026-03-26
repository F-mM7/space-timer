import React from 'react';
import { MinimalHashCheckUI } from '../components/MinimalHashCheckUI';
import { PageHeader } from '../components/PageHeader';

const MinimalHashCheckPage: React.FC = () => {
  return (
    <div className="app" style={{ backgroundColor: '#1a1a2e', minHeight: '100vh' }}>
      <PageHeader />
      <MinimalHashCheckUI />
    </div>
  );
};

export default MinimalHashCheckPage;
