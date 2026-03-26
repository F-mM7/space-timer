import React from 'react';
import { TimerStatus } from '../types/timer';
import { formatDuration } from '../hooks/useHistogram';

interface TimerProps {
  status: TimerStatus;
  elapsedTime: number;
  standbyProgress: number;
}

export const Timer: React.FC<TimerProps> = ({ status, elapsedTime, standbyProgress }) => {
  const getStatusText = () => {
    switch (status) {
      case 'idle':
        return '待機中';
      case 'standby':
        return 'スタンバイ';
      case 'running':
        return '計測中';
      case 'stopped':
        return '停止';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'idle':
        return '#888';
      case 'standby':
        return '#ff9800';
      case 'running':
        return '#4caf50';
      case 'stopped':
        return '#f44336';
      default:
        return '#888';
    }
  };

  const getInstructions = () => {
    switch (status) {
      case 'idle':
        return 'スペースキーを0.2秒間長押ししてスタート';
      case 'standby':
        return 'キーを離して計測開始';
      case 'running':
        return 'スペースキーを押して停止';
      case 'stopped':
        return 'スペースキーを0.2秒間長押しして再スタート';
      default:
        return '';
    }
  };

  return (
    <div className="timer-container">
      <div className="timer-display">
        <div
          className="timer-status"
          style={{ color: getStatusColor() }}
        >
          {getStatusText()}
        </div>

        <div className="timer-time">
          {formatDuration(elapsedTime)}
        </div>

        {/* スタンバイプログレスバー */}
        {(status === 'idle' || status === 'stopped') && standbyProgress > 0 && (
          <div className="standby-progress-container">
            <div
              className="standby-progress-bar"
              style={{
                width: `${standbyProgress}%`,
                backgroundColor: '#ff9800',
                transition: 'none'  // トランジションを無効化して即座に更新
              }}
            />
          </div>
        )}

        <div className="timer-instructions">
          {getInstructions()}
        </div>
      </div>

      <style>{`
        .timer-container {
          text-align: center;
          padding: 1.5rem;
          background: rgba(30, 30, 45, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.3);
          backdrop-filter: blur(10px);
          height: 100%; /* グリッド内で全高を使う */
          display: flex;
          flex-direction: column;
          justify-content: center; /* 中央配置 */
        }

        .timer-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .timer-status {
          font-size: 1rem;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .timer-time {
          font-size: 3.5rem;
          font-weight: 300;
          font-family: 'Courier New', monospace;
          color: #ffffff;
          min-height: 4rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .standby-progress-container {
          width: 100%;
          max-width: 300px;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
        }

        .standby-progress-bar {
          height: 100%;
          border-radius: 2px;
        }

        .timer-instructions {
          font-size: 0.8rem;
          color: #b0b0b0;
          margin-top: 0.25rem;
        }

        @media (max-width: 768px) {
          .timer-container {
            padding: 0.75rem;
          }

          .timer-display {
            gap: 0.4rem;
          }

          .timer-time {
            font-size: 2rem;
            min-height: 2.5rem;
          }

          .timer-status {
            font-size: 0.9rem;
          }

          .timer-instructions {
            font-size: 0.75rem;
          }
        }

        @media (max-width: 480px) {
          .timer-container {
            padding: 0.5rem;
          }

          .timer-display {
            gap: 0.3rem;
          }

          .timer-time {
            font-size: 1.5rem;
            min-height: 2rem;
          }

          .timer-status {
            font-size: 0.8rem;
            letter-spacing: 0.5px;
          }

          .timer-instructions {
            font-size: 0.7rem;
          }
        }
      `}</style>
    </div>
  );
};