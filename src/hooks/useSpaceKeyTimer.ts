import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { TimeRecord, TimerState, TimerStatus } from '../types/timer';

const STANDBY_DURATION = 200; // 0.2秒（ミリ秒）
const SPACE_KEY = ' ';

interface UseSpaceKeyTimerReturn {
  status: TimerStatus;
  elapsedTime: number;
  standbyProgress: number;
  records: TimeRecord[];
  addRecord: (record: TimeRecord) => void;
}

export function useSpaceKeyTimer(
  onRecordComplete?: (record: TimeRecord) => void
): UseSpaceKeyTimerReturn {
  const [state, setState] = useState<TimerState>({
    isStandby: false,
    isRunning: false,
    startTime: null,
    standbyStartTime: null,
  });

  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [standbyProgress, setStandbyProgress] = useState<number>(0);
  const [records, setRecords] = useState<TimeRecord[]>([]);

  const standbyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spaceKeyPressedRef = useRef<boolean>(false);

  // stateとonRecordCompleteを最新の値として保持
  const stateRef = useRef(state);
  const onRecordCompleteRef = useRef(onRecordComplete);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    onRecordCompleteRef.current = onRecordComplete;
  }, [onRecordComplete]);

  // プログレス更新タイマーのクリア
  const clearProgressInterval = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  // タイマーのクリーンアップ
  const clearTimers = () => {
    if (standbyTimerRef.current) {
      clearTimeout(standbyTimerRef.current);
      standbyTimerRef.current = null;
    }
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
    clearProgressInterval();
  };

  // 記録を追加
  const addRecord = (record: TimeRecord) => {
    setRecords(prev => [...prev, record]);
    if (onRecordCompleteRef.current) {
      onRecordCompleteRef.current(record);
    }
  };

  // イベントリスナーの登録
  useEffect(() => {
    // スペースキー押下時の処理
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== SPACE_KEY || e.repeat || spaceKeyPressedRef.current) return;
      e.preventDefault();


      spaceKeyPressedRef.current = true;
      const currentState = stateRef.current;

      // 計測中の場合は終了
      if (currentState.isRunning && currentState.startTime !== null) {
        const duration = Date.now() - currentState.startTime;
        const newRecord: TimeRecord = {
          id: uuidv4(),
          duration,
          timestamp: new Date(),
        };

        addRecord(newRecord);
        clearTimers();

        // 計測終了後の状態リセット
        setState({
          isStandby: false,
          isRunning: false,
          startTime: null,
          standbyStartTime: null,
        });
        // elapsedTimeは保持して表示を残す（次の計測開始時にリセット）
      } else if (!currentState.isRunning && !currentState.isStandby && currentState.standbyStartTime === null) {
        // スタンバイ開始
        const standbyStart = Date.now();
        setState(prev => ({
          ...prev,
          standbyStartTime: standbyStart,
        }));

        // プログレス更新（5msごとに更新して滑らかに）
        progressIntervalRef.current = setInterval(() => {
          const elapsed = Date.now() - standbyStart;
          const progress = Math.min((elapsed / STANDBY_DURATION) * 100, 100);
          setStandbyProgress(progress);
        }, 5);

        // 0.2秒後にスタンバイ状態にする
        standbyTimerRef.current = setTimeout(() => {
          setState(prev => ({
            ...prev,
            isStandby: true,
          }));
          setStandbyProgress(100);
          clearProgressInterval();
        }, STANDBY_DURATION);
      }
    };

    // スペースキー離した時の処理
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key !== SPACE_KEY) return;
      e.preventDefault();


      spaceKeyPressedRef.current = false;
      const currentState = stateRef.current;

      // スタンバイ状態の場合は計測開始
      if (currentState.isStandby && !currentState.isRunning) {
        const startTime = Date.now();
        setState({
          isStandby: false,
          isRunning: true,
          startTime,
          standbyStartTime: null,
        });

        // 前回の計測時間をリセット
        setElapsedTime(0);

        // 経過時間の更新を開始
        elapsedTimerRef.current = setInterval(() => {
          setElapsedTime(Date.now() - startTime);
        }, 10);

        setStandbyProgress(0);
        clearProgressInterval();
      } else if (currentState.standbyStartTime !== null && !currentState.isStandby && !currentState.isRunning) {
        // スタンバイ中断（0.2秒経過前に離した場合）
        clearTimers();
        setState({
          isStandby: false,
          isRunning: false,
          startTime: null,
          standbyStartTime: null,
        });
        setStandbyProgress(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearTimers();
    };
  }, []); // 空の依存配列で一度だけ登録

  // 現在のステータスを判定
  const getStatus = (): TimerStatus => {
    if (state.isRunning) return 'running';
    if (state.isStandby) return 'standby';
    if (state.standbyStartTime !== null) return 'idle'; // スタンバイ準備中
    if (elapsedTime > 0) return 'stopped';
    return 'idle';
  };

  return {
    status: getStatus(),
    elapsedTime,
    standbyProgress,
    records,
    addRecord,
  };
}