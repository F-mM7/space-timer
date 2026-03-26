import React, { useState } from 'react';
import { CenterType } from '../hashToUnfoldedView';
import {
  hexStringToUnfoldedView,
  hashToUnfoldedView
} from '../hashToUnfoldedView';
import {
  centersToHash,
  hashToHexString,
  validateCenters
} from '../unfoldedViewToHash';
import { generateRandomHash } from '../randomHashGenerator';

/**
 * 統合された白黄センターユーティリティ
 */
export const WhiteYellowCenterUtilitiesIntegrated: React.FC = () => {
  const [centers, setCenters] = useState<CenterType[]>(new Array(24).fill('-'));
  const [hashInput, setHashInput] = useState<string>('');
  const [warning, setWarning] = useState<string>('');

  // センタータイプのサイクル順
  const cycleType = (current: CenterType): CenterType => {
    switch (current) {
      case '-': return 'W';
      case 'W': return 'Y';
      case 'Y': return '-';
      default: return '-';
    }
  };

  // 現在のハッシュ値を計算
  const getCurrentHash = (): string => {
    try {
      const hash = centersToHash(centers);
      return hashToHexString(hash);
    } catch {
      return '計算エラー';
    }
  };

  // 警告メッセージを更新
  const updateWarning = (currentCenters: CenterType[]) => {
    const validation = validateCenters(currentCenters);
    if (!validation.valid) {
      setWarning(`⚠️ 不正な配置: 白 ${validation.whiteCount}個, 黄 ${validation.yellowCount}個（正規: 各4個）`);
    } else {
      setWarning('');
    }
  };

  // 展開図のセンターをクリック
  const handleCenterClick = (index: number) => {
    const newCenters = [...centers];
    newCenters[index] = cycleType(centers[index]);
    setCenters(newCenters);
    updateWarning(newCenters);
  };

  // ハッシュ値を展開図に適用
  const handleApplyHash = () => {
    try {
      if (!hashInput.trim()) {
        setWarning('ハッシュ値を入力してください');
        return;
      }

      const view = hexStringToUnfoldedView(hashInput);
      setCenters(view.centers);
      updateWarning(view.centers);
    } catch (err) {
      setWarning(err instanceof Error ? err.message : '無効なハッシュ値です');
    }
  };

  // ランダム生成
  const handleRandomGenerate = () => {
    const hash = generateRandomHash();
    const view = hashToUnfoldedView(hash);
    setCenters(view.centers);
    setHashInput(hashToHexString(hash));
    setWarning(''); // ランダム生成は常に正規の配置
  };

  // リセット
  const handleReset = () => {
    setCenters(new Array(24).fill('-'));
    setHashInput('');
    setWarning('');
  };

  // センターの色を取得
  const getCenterColor = (type: CenterType): string => {
    switch (type) {
      case 'W': return '#FFFFFF';
      case 'Y': return '#FFD700';
      default: return '#4b5563';
    }
  };

  // センターのテキスト色を取得
  const getCenterTextColor = (type: CenterType): string => {
    return type === 'W' ? '#000000' : '#000000';
  };

  // センターボタンをレンダリング
  const renderCenter = (index: number, key: string) => (
    <button
      key={key}
      onClick={() => handleCenterClick(index)}
      style={{
        width: '45px',
        height: '45px',
        backgroundColor: getCenterColor(centers[index]),
        color: getCenterTextColor(centers[index]),
        border: '2px solid #6b7280',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: '20px',
        fontFamily: 'monospace',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.border = '2px solid #3b82f6';
        e.currentTarget.style.transform = 'scale(1.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.border = '2px solid #6b7280';
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      {centers[index]}
    </button>
  );

  // 空のセルをレンダリング
  const renderEmpty = (key: string) => (
    <div key={key} style={{ width: '45px', height: '45px' }} />
  );

  return (
    <div style={{ padding: '20px', backgroundColor: '#111827', minHeight: '100vh', color: '#e5e7eb' }}>
      <h1 style={{ marginBottom: '20px', color: '#f3f4f6' }}>ハッシュ確認</h1>

      {/* コントロール部 */}
      <div style={{
        marginBottom: '20px',
        padding: '20px',
        backgroundColor: '#1f2937',
        borderRadius: '8px',
        border: '1px solid #374151'
      }}>
        {/* ハッシュ値入力行 */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ color: '#d1d5db', marginRight: '10px' }}>
            ハッシュ値:
          </label>
          <input
            type="text"
            value={hashInput}
            onChange={(e) => setHashInput(e.target.value)}
            placeholder="例: 0x000F000F0000"
            style={{
              padding: '8px 12px',
              fontSize: '14px',
              fontFamily: 'monospace',
              width: '200px',
              backgroundColor: '#374151',
              color: '#f3f4f6',
              border: '1px solid #4b5563',
              borderRadius: '4px',
              marginRight: '10px'
            }}
          />
          <button
            onClick={handleApplyHash}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              cursor: 'pointer',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              marginRight: '10px'
            }}
          >
            適用
          </button>
        </div>

        {/* ボタン行 */}
        <div>
          <button
            onClick={handleRandomGenerate}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              cursor: 'pointer',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              marginRight: '10px'
            }}
          >
            ランダム生成
          </button>
          <button
            onClick={handleReset}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              cursor: 'pointer',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            リセット
          </button>
        </div>
      </div>

      {/* 展開図 */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#f3f4f6', marginBottom: '10px' }}>
          展開図（クリックで切り替え: - → W → Y → -）
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 45px)',
          gridTemplateRows: 'repeat(6, auto)',
          gap: '3px',
          width: 'fit-content'
        }}>
          {/* 1行目: U面の上半分 */}
          {renderEmpty('e1')}
          {renderEmpty('e2')}
          {renderCenter(0, 'u0')}
          {renderCenter(1, 'u1')}
          {renderEmpty('e3')}
          {renderEmpty('e4')}
          {renderEmpty('e5')}
          {renderEmpty('e6')}

          {/* 2行目: U面の下半分 */}
          {renderEmpty('e7')}
          {renderEmpty('e8')}
          {renderCenter(3, 'u3')}
          {renderCenter(2, 'u2')}
          {renderEmpty('e9')}
          {renderEmpty('e10')}
          {renderEmpty('e11')}
          {renderEmpty('e12')}

          {/* 3行目: L, F, R, B面の上半分 */}
          {renderCenter(4, 'l0')}
          {renderCenter(5, 'l1')}
          {renderCenter(8, 'f0')}
          {renderCenter(9, 'f1')}
          {renderCenter(12, 'r0')}
          {renderCenter(13, 'r1')}
          {renderCenter(16, 'b0')}
          {renderCenter(17, 'b1')}

          {/* 4行目: L, F, R, B面の下半分 */}
          {renderCenter(7, 'l3')}
          {renderCenter(6, 'l2')}
          {renderCenter(11, 'f3')}
          {renderCenter(10, 'f2')}
          {renderCenter(15, 'r3')}
          {renderCenter(14, 'r2')}
          {renderCenter(19, 'b3')}
          {renderCenter(18, 'b2')}

          {/* 5行目: D面の上半分 */}
          {renderEmpty('e13')}
          {renderEmpty('e14')}
          {renderCenter(20, 'd0')}
          {renderCenter(21, 'd1')}
          {renderEmpty('e15')}
          {renderEmpty('e16')}
          {renderEmpty('e17')}
          {renderEmpty('e18')}

          {/* 6行目: D面の下半分 */}
          {renderEmpty('e19')}
          {renderEmpty('e20')}
          {renderCenter(23, 'd3')}
          {renderCenter(22, 'd2')}
          {renderEmpty('e21')}
          {renderEmpty('e22')}
          {renderEmpty('e23')}
          {renderEmpty('e24')}
        </div>
      </div>

      {/* 現在のハッシュ値表示 */}
      <div style={{
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#1f2937',
        borderRadius: '8px',
        border: '1px solid #374151'
      }}>
        <h3 style={{ color: '#f3f4f6', marginBottom: '10px' }}>現在のハッシュ値:</h3>
        <div style={{
          padding: '10px',
          backgroundColor: '#111827',
          borderRadius: '5px',
          fontFamily: 'monospace',
          fontSize: '18px',
          color: '#3b82f6',
          border: '1px solid #374151'
        }}>
          {getCurrentHash()}
        </div>
      </div>

      {/* 警告メッセージ */}
      {warning && (
        <div style={{
          padding: '10px 15px',
          backgroundColor: '#991b1b',
          color: '#fee2e2',
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          {warning}
        </div>
      )}
    </div>
  );
};