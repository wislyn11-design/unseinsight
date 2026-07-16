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
  const [saju, setSaju] = useState<any>(null);
  const [metadata, setMetadata] = useState<any>(null);
  
  const [interpretation, setInterpretation] = useState('');
  const [loadingSaju, setLoadingSaju] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [error, setError] = useState('');

  async function handleSaju() {
    if (!form.year || !form.month || !form.day) {
      setError('생년월일을 모두 입력해주세요.');
      return;
    }

    // 💡 [여기서부터 새로 추가하는 시간 검문소(검증 로직) 입니다!]
    if (form.hourInput && form.hourInput.length > 0) {
      // 1. 숫자를 4자리까지 다 치지 않고 덜 친 경우 (예: '00'만 입력)
      if (form.hourInput.length !== 4) {
        alert("태어난 시간은 4자리 숫자(예: 1410, 0030)로 끝까지 입력해주세요.");
        return;
      }

      // 2. 시간(0~23)이나 분(0~59)의 범위를 벗어난 경우 (예: '2430' 입력)
      const h = parseInt(form.hourInput.slice(0, 2), 10);
      const m = parseInt(form.hourInput.slice(2, 4), 10);

      if (h >= 24 || m >= 60) {
        alert("올바른 시간이 아닙니다!\n시간은 00~23, 분은 00~59 사이로 입력해주세요.\n(밤 12시는 '0000'으로 입력하시면 됩니다.)");
        setForm({ ...form, hourInput: '', hour: -1 }); // 💡 엉뚱한 값을 썼으니 입력창을 모름 상태로 깔끔하게 비워줍니다.
        return;
      }
    }
    // 💡 [시간 검문소 로직 끝]


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
      

      if (!res.body) {
        throw new Error('응답 스트림을 받을 수 없습니다.');
      }

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