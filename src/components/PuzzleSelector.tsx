import React from 'react';
import type { PuzzleType } from '../types/scramble';
import { PUZZLE_TYPES } from '../types/scramble';

interface PuzzleSelectorProps {
  selectedPuzzle: PuzzleType;
  onPuzzleChange: (puzzle: PuzzleType) => void;
}

export const PuzzleSelector: React.FC<PuzzleSelectorProps> = ({
  selectedPuzzle,
  onPuzzleChange
}) => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: '24px'
  };

  const buttonStyle = (isSelected: boolean): React.CSSProperties => ({
    padding: '12px 24px',
    background: isSelected
      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      : 'rgba(255, 255, 255, 0.05)',
    border: `1px solid ${isSelected ? 'transparent' : 'rgba(255, 255, 255, 0.1)'}`,
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '1rem',
    fontWeight: isSelected ? '600' : '400',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    minWidth: '80px'
  });

  const nameStyle: React.CSSProperties = {
    fontSize: '1.1rem'
  };

  const descriptionStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: 'rgba(255, 255, 255, 0.7)',
    whiteSpace: 'nowrap'
  };

  return (
    <div style={containerStyle}>
      {PUZZLE_TYPES.map((puzzle) => (
        <button
          key={puzzle.id}
          onClick={() => onPuzzleChange(puzzle.id)}
          style={buttonStyle(selectedPuzzle === puzzle.id)}
          onMouseEnter={(e) => {
            if (selectedPuzzle !== puzzle.id) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }
          }}
          onMouseLeave={(e) => {
            if (selectedPuzzle !== puzzle.id) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }
          }}
        >
          <span style={nameStyle}>{puzzle.name}</span>
          <span style={descriptionStyle}>{puzzle.description}</span>
        </button>
      ))}
    </div>
  );
};