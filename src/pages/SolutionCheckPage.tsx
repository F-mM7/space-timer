import React from 'react';
import { SolutionCheckUI } from '../components/SolutionCheckUI';
import { PageHeader } from '../components/PageHeader';

const SolutionCheckPage: React.FC = () => {
  return (
    <div className="app" style={{ backgroundColor: '#1a1a2e', minHeight: '100vh' }}>
      <PageHeader />
      <SolutionCheckUI />
    </div>
  );
};

export default SolutionCheckPage;
