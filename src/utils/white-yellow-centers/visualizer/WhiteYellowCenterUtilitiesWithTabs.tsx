import React, { useState } from 'react';
import { WhiteYellowCenterUtilitiesIntegrated } from './WhiteYellowCenterUtilitiesIntegrated';
import { HashTransitionVisualizer } from './HashTransitionVisualizer';

type TabType = 'editor' | 'transition';

/**
 * タブ付き白黄センターユーティリティ
 */
export const WhiteYellowCenterUtilitiesWithTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('editor');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#111827' }}>
      {/* タブヘッダー */}
      <div style={{
        display: 'flex',
        backgroundColor: '#1f2937',
        borderBottom: '2px solid #374151',
        padding: '0 20px'
      }}>
        <button
          onClick={() => setActiveTab('editor')}
          style={{
            padding: '15px 30px',
            backgroundColor: activeTab === 'editor' ? '#111827' : 'transparent',
            color: activeTab === 'editor' ? '#3b82f6' : '#9ca3af',
            border: 'none',
            borderBottom: activeTab === 'editor' ? '2px solid #3b82f6' : 'none',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: activeTab === 'editor' ? 'bold' : 'normal',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== 'editor') {
              e.currentTarget.style.color = '#e5e7eb';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'editor') {
              e.currentTarget.style.color = '#9ca3af';
            }
          }}
        >
          ハッシュ⇔展開図変換
        </button>

        <button
          onClick={() => setActiveTab('transition')}
          style={{
            padding: '15px 30px',
            backgroundColor: activeTab === 'transition' ? '#111827' : 'transparent',
            color: activeTab === 'transition' ? '#3b82f6' : '#9ca3af',
            border: 'none',
            borderBottom: activeTab === 'transition' ? '2px solid #3b82f6' : 'none',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: activeTab === 'transition' ? 'bold' : 'normal',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== 'transition') {
              e.currentTarget.style.color = '#e5e7eb';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'transition') {
              e.currentTarget.style.color = '#9ca3af';
            }
          }}
        >
          ハッシュ変換可視化
        </button>
      </div>

      {/* タブコンテンツ */}
      <div>
        {activeTab === 'editor' && <WhiteYellowCenterUtilitiesIntegrated />}
        {activeTab === 'transition' && <HashTransitionVisualizer />}
      </div>
    </div>
  );
};