import React from 'react';
import { ScrambleGenerator } from '../components/ScrambleGenerator';
import { PageHeader } from '../components/PageHeader';

const ScramblePage: React.FC = () => {
  const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
    color: '#ffffff',
    position: 'relative'
  };

  const spinnerStyle = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .spinner {
      width: 24px;
      height: 24px;
      border: 3px solid rgba(255, 255, 255, 0.2);
      border-top: 3px solid #9333ea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
  `;

  return (
    <div style={pageStyle}>
      <style>{spinnerStyle}</style>
      <PageHeader />

      <ScrambleGenerator />
    </div>
  );
};

export default ScramblePage;