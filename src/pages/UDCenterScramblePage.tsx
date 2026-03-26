import React from 'react';
import UDCenterScrambleUI from '../components/UDCenterScrambleUI';
import { PageHeader } from '../components/PageHeader';

const UDCenterScramblePage: React.FC = () => {
  return (
    <div className="app" style={{ backgroundColor: '#1a1a2e', minHeight: '100vh' }}>
      <PageHeader />
      <UDCenterScrambleUI />
    </div>
  );
};

export default UDCenterScramblePage;
