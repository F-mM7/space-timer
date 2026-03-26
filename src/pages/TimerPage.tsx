import '../App.css';
import { Timer } from '../components/Timer';
import { Statistics } from '../components/Statistics';
import { TimeRecordsList } from '../components/TimeRecordsList';
import { useSpaceKeyTimer } from '../hooks/useSpaceKeyTimer';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { TimeRecord } from '../types/timer';
import { PageHeader } from '../components/PageHeader';

function TimerPage() {
  const [savedRecords, setSavedRecords] = useLocalStorage<TimeRecord[]>('timerRecords', []);

  const { status, elapsedTime, standbyProgress } = useSpaceKeyTimer((newRecord) => {
    setSavedRecords((prev) => [...prev, newRecord]);
  });

  const handleClearRecords = () => {
    if (window.confirm('すべての記録を削除しますか？この操作は取り消せません。')) {
      setSavedRecords([]);
    }
  };

  const handleDeleteLastRecord = () => {
    if (savedRecords.length > 0) {
      if (window.confirm('最後の記録を削除しますか？')) {
        setSavedRecords((prev) => prev.slice(0, -1));
      }
    }
  };

  return (
    <div className="app">
      <PageHeader />
      <main className="app-main">
        {/* 上部エリア */}
        <div className="upper-section">
          <TimeRecordsList
            records={savedRecords}
            onClearRecords={handleClearRecords}
            onDeleteLastRecord={handleDeleteLastRecord}
          />
          <Timer
            status={status}
            elapsedTime={elapsedTime}
            standbyProgress={standbyProgress}
          />
        </div>

        {/* 下部エリア */}
        <div className="lower-section">
          <Statistics records={savedRecords} />
        </div>
      </main>
    </div>
  );
}

export default TimerPage;