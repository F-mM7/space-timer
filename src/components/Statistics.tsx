import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TimeRecord } from '../types/timer';
import { useHistogram, formatDuration, formatStdDev } from '../hooks/useHistogram';

interface StatisticsProps {
  records: TimeRecord[];
}

export const Statistics: React.FC<StatisticsProps> = ({ records }) => {
  const { bins, stats } = useHistogram(records);

  if (records.length === 0) {
    return (
      <div className="statistics-container">
        <h2>統計情報</h2>
        <p className="no-data">まだデータがありません。タイマーを使用してデータを記録してください。</p>

        <style>{`
          .statistics-container {
            padding: 2rem;
            background: rgba(30, 30, 45, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            margin-bottom: 2rem;
            backdrop-filter: blur(10px);
          }

          .statistics-container h2 {
            margin-top: 0;
            margin-bottom: 1.5rem;
            color: #ffffff;
            font-size: 1.5rem;
          }

          .no-data {
            text-align: center;
            color: #b0b0b0;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="statistics-container">
      <h2>統計情報</h2>

      {/* 基本統計（3項目のみ） */}
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-label">記録数</div>
          <div className="stat-value">{stats.count}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">平均時間</div>
          <div className="stat-value">{formatDuration(stats.average)}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">標準偏差</div>
          <div className="stat-value">{formatStdDev(stats.stdDev)}</div>
        </div>
      </div>

      {/* ヒストグラム */}
      <div className="histogram-container">
        <h3>時間分布</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={bins}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="range"
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              label={{ value: '件数', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="count"
              fill="#4caf50"
              name="記録数"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <style>{`
        .statistics-container {
          padding: 0.75rem;
          background: rgba(30, 30, 45, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.3);
          backdrop-filter: blur(10px);
          height: 100%; /* 全高を使う */
          display: flex;
          flex-direction: column;
          overflow: hidden; /* スクロールを無効化 */
        }

        @media (max-width: 768px) {
          .statistics-container {
            padding: 0.75rem;
          }
        }

        @media (max-width: 480px) {
          .statistics-container {
            padding: 0.5rem;
          }
        }

        .statistics-container h2 {
          margin-top: 0;
          margin-bottom: 0.5rem;
          color: #ffffff;
          font-size: 1rem;
        }

        @media (max-width: 768px) {
          .statistics-container h2 {
            font-size: 0.9rem;
            margin-bottom: 0.4rem;
          }
        }

        .statistics-container h3 {
          margin-top: 0.5rem;
          margin-bottom: 0.3rem;
          color: #e0e0e0;
          font-size: 0.85rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr); /* 3列固定 */
          gap: 0.4rem;
          margin-bottom: 0.5rem;
        }

        .stat-item {
          background: rgba(255, 255, 255, 0.05);
          padding: 0.4rem;
          border-radius: 6px;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .stat-label {
          font-size: 0.7rem;
          color: #b0b0b0;
          margin-bottom: 0.2rem;
        }

        .stat-value {
          font-size: 0.85rem;
          font-weight: bold;
          color: #ffffff;
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(3, 1fr); /* 3列維持 */
            gap: 0.4rem;
          }

          .stat-item {
            padding: 0.4rem;
          }

          .stat-label {
            font-size: 0.65rem;
          }

          .stat-value {
            font-size: 0.75rem;
          }
        }

        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: repeat(3, 1fr); /* 3列維持 */
          }

          .stat-item {
            padding: 0.35rem;
          }

          .stat-label {
            font-size: 0.6rem;
          }

          .stat-value {
            font-size: 0.7rem;
          }
        }

        .histogram-container {
          margin-top: 0.3rem;
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }

        .recharts-cartesian-grid-line {
          stroke: rgba(255, 255, 255, 0.1);
        }

        .recharts-text {
          fill: #b0b0b0;
        }

        .recharts-bar-rectangle {
          fill: #4caf50 !important;
        }
      `}</style>
    </div>
  );
};