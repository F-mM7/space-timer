import React from 'react';
import { WhiteYellowCenterUtilities } from '../utils/white-yellow-centers/visualizer/WhiteYellowCenterUtilities';
import { PageHeader } from '../components/PageHeader';

const WhiteYellowUtilitiesPage: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f0f0' }}>
      <PageHeader />
      <WhiteYellowCenterUtilities />
    </div>
  );
};

export default WhiteYellowUtilitiesPage;