import React from 'react';
import { UDCenterSolverCheckUI } from '../components/UDCenterSolverCheckUI';
import { PageHeader } from '../components/PageHeader';

const UDCenterSolverCheckPage: React.FC = () => {
  return (
    <div className="app" style={{ backgroundColor: '#1a1a2e', minHeight: '100vh' }}>
      <PageHeader />
      <UDCenterSolverCheckUI />
    </div>
  );
};

export default UDCenterSolverCheckPage;
