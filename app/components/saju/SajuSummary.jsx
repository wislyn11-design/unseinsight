'use client';

import React, { useState, useEffect } from 'react';

export default function SajuSummary({ saju, gender }) {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch('/api/summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ saju, gender }),
        });
        
        const data = await res.json();
        
        if (res.ok && data.summary) {
            setSummary(data.summary);
          } else {
            setSummary(`[서버 오류] ${data.error || '총론을 불러오지 못했습니다.'}`);
          }
        } catch (error) {
          setSummary('네트워크 오류가 발생했습니다.');
        } finally {
          setLoading(false);
        }
      };
  
      if (saju && saju.year && saju.month && saju.day) {
        fetchSummary();
      }
    }, [saju, gender]);


  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #f5f7ff 0%, #ffffff 100%)', 
      borderRadius: '12px', padding: '24px', marginBottom: '20px', 
      border: '1px solid #e0e7ff', boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
    }}>
      <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>✨</span> AI 명리 상담사의 사주 총론
      </h2>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280', fontSize: '15px' }}>
          고객님의 사주 원국을 깊이 있게 분석하고 있습니다... ⏳
        </div>
      ) : (
        <div style={{ fontSize: '15px', lineHeight: '1.8', color: '#374151' }}>
          {summary.split('\n').map((line, index) => {
            if (line.trim() === '') return null;
            if (line.includes('[') && line.includes(']')) {
              return <p key={index} style={{ fontWeight: 'bold', color: '#3a5bbf', marginTop: '16px', marginBottom: '4px' }}>{line}</p>;
            }
            return <p key={index} style={{ marginBottom: '12px' }}>{line}</p>;
          })}
        </div>
      )}
    </div>
  );
}