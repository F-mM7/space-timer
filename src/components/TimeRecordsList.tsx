import React from 'react';
import { TimeRecord } from '../types/timer';
import { formatDuration } from '../hooks/useHistogram';

interface TimeRecordsListProps {
  records: TimeRecord[];
  onClearRecords: () => void;
  onDeleteLastRecord: () => void;
}

export const TimeRecordsList: React.FC<TimeRecordsListProps> = ({ records, onClearRecords, onDeleteLastRecord }) => {
  // 最新の12件を表示（新しい順）
  const displayRecords = [...records].reverse().slice(0, 12);

  const formatTimestamp = (date: Date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
  };

  return (
    <div className="records-list-container">
      <div className="records-header">
        <h2>記録履歴</h2>
        {records.length > 0 && (
          <div className="button-group">
            <button
              className="delete-last-button"
              onClick={onDeleteLastRecord}
              title="最後の記録を削除"
            >
              削除
            </button>
            <button
              className="clear-button"
              onClick={onClearRecords}
              title="すべてクリア"
            >
              クリア
            </button>
          </div>
        )}
      </div>

      {records.length === 0 ? (
        <p className="no-records">記録がありません</p>
      ) : (
        <div className="records-table">
          <div className="table-header">
            <div className="table-cell">#</div>
            <div className="table-cell">時間</div>
            <div className="table-cell">記録日時</div>
          </div>
          {displayRecords.map((record, index) => (
            <div key={record.id} className="table-row">
              <div className="table-cell">{records.length - index}</div>
              <div className="table-cell duration">{formatDuration(record.duration)}</div>
              <div className="table-cell">{formatTimestamp(record.timestamp)}</div>
            </div>
          ))}
        </div>
      )}


      <style>{`
        .records-list-container {
          padding: 0.75rem;
          background: rgba(30, 30, 45, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.3);
          backdrop-filter: blur(10px);
          height: 100%; /* グリッド内で全高を使う */
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        @media (max-width: 768px) {
          .records-list-container {
            padding: 0.75rem;
          }
        }

        @media (max-width: 480px) {
          .records-list-container {
            padding: 0.5rem;
          }
        }

        .records-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
          flex-shrink: 0;
        }

        .records-header h2 {
          margin: 0;
          color: #ffffff;
          font-size: 1rem;
        }

        .button-group {
          display: flex;
          gap: 0.5rem;
        }

        .delete-last-button {
          padding: 0.25rem 0.5rem;
          background: #ff9800;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.7rem;
          transition: background 0.3s;
        }

        .delete-last-button:hover {
          background: #f57c00;
        }

        .clear-button {
          padding: 0.25rem 0.5rem;
          background: #f44336;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.7rem;
          transition: background 0.3s;
        }

        .clear-button:hover {
          background: #d32f2f;
        }

        @media (max-width: 768px) {
          .records-header {
            flex-direction: column;
            gap: 0.5rem;
            align-items: flex-start;
            margin-bottom: 0.5rem;
          }

          .records-header h2 {
            font-size: 0.95rem;
          }

          .button-group {
            width: 100%;
            justify-content: flex-start;
          }

          .delete-last-button,
          .clear-button {
            padding: 0.25rem 0.5rem;
            font-size: 0.7rem;
          }
        }

        @media (max-width: 480px) {
          .records-header h2 {
            font-size: 0.85rem;
          }

          .delete-last-button,
          .clear-button {
            padding: 0.2rem 0.4rem;
            font-size: 0.65rem;
          }
        }

        .no-records {
          text-align: center;
          color: #b0b0b0;
          padding: 2rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
        }

        .records-table {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          flex: 1;
          overflow-y: hidden; /* スクロールを無効化 */
          overflow-x: hidden;
          min-height: 0;
        }

        .table-header {
          display: grid;
          grid-template-columns: 40px 1fr 1.8fr;
          background: rgba(255, 255, 255, 0.08);
          font-weight: bold;
          padding: 0.4rem 0.5rem;
          color: #ffffff;
          font-size: 0.75rem;
          position: sticky;
          top: 0;
          z-index: 1;
        }

        .table-row {
          display: grid;
          grid-template-columns: 40px 1fr 1.8fr;
          padding: 0.4rem 0.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          transition: background 0.2s;
          color: #e0e0e0;
          font-size: 0.75rem;
        }

        @media (max-width: 768px) {
          .table-header,
          .table-row {
            grid-template-columns: 35px 1fr 1.5fr;
            padding: 0.4rem;
            font-size: 0.7rem;
          }
        }

        @media (max-width: 480px) {
          .table-header,
          .table-row {
            grid-template-columns: 30px 1fr 1.2fr;
            padding: 0.3rem 0.2rem;
            font-size: 0.65rem;
          }
        }

        .table-row:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .table-row:last-child {
          border-bottom: none;
        }

        .table-cell {
          padding: 0 0.25rem;
          display: flex;
          align-items: center;
        }

        @media (max-width: 480px) {
          .table-cell {
            padding: 0 0.1rem;
          }
        }

        .table-cell.duration {
          font-weight: 500;
          color: #4caf50;
        }
      `}</style>
    </div>
  );
};