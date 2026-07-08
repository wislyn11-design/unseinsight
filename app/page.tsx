'use client';
import { useState } from 'react';
import InputForm from './components/saju/InputForm.jsx';
import SajuTable from './components/saju/SajuTable.jsx';
import AIResult from './components/saju/AIResult.jsx';
import Daeun from './components/saju/Daeun.jsx';
import Seun from './components/saju/Seun.jsx';
import Wolun from './components/saju/Wolun.jsx';

export default function Home() {
  const [form, setForm] = useState({
    year: '', month: '', day: '', hour: -1,
    gender: '남', calType: '양력', isLeap: false,
    hourInput: '', yajasi: false,
  });
  const [saju, setSaju] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [interpretation, setInterpretation] = useState('');
  const [loadingSaju, setLoadingSaju] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [error, setError] = useState('');

  async function handleSaju() {
    if (!form.year || !form.month || !form.day) {
      setError('생년월일을 모두 입력해주세요.');
      return;
    }
    setError('');
    setLoadingSaju(true);
    setSaju(null);
    setInterpretation('');
    try {
      const res = await fetch('/api/saju', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setSaju(data.saju);
      setMetadata(data.metadata);
    } catch (err) {
      setError('오류: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoadingSaju(false);
    }
  }

  // 💡 [핵심] AI 풀이를 실시간 스트리밍으로 받도록 전면 수정
  async function handleAI() {
    if (!saju) return;
    setLoadingAI(true); // 처음 1~2초 잠깐 대기
    setInterpretation('');
    setError('');
    
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saju }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || '서버 오류가 발생했습니다.');
      }

      setLoadingAI(false); // 글자가 날아오기 시작하면 대기 화면(구슬) 해제!
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;

      // 조각(chunk)이 도착할 때마다 기존 텍스트에 한 글자씩 이어 붙입니다.
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          setInterpretation(prev => prev + chunk);
        }
      }
    } catch (err) {
      setError('AI 오류: ' + (err instanceof Error ? err.message : String(err)));
      setLoadingAI(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: '-apple-system, sans-serif' }}>
      <div style={{ background: '#3a5bbf', color: '#fff', padding: '16px 20px' }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>운세인사이트</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.85 }}>AI 사주풀이</p>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px' }}>
        <InputForm form={form} setForm={setForm} onSubmit={handleSaju} loading={loadingSaju} error={error} />
        {saju && <SajuTable saju={saju} form={form} />}
        {saju && saju.daeun && <Daeun daeun={saju.daeun} dayGan={saju.day?.gan} birthYear={Number(form.year)} />}
        {saju && <Seun saju={saju} birthYear={Number(form.year)} />}
        {saju && <Wolun saju={saju} />}
        {saju && (
          <AIResult saju={saju} interpretation={interpretation} loading={loadingAI} error={error} onRequest={handleAI} />
        )}
      </div>
    </main>
  );
}