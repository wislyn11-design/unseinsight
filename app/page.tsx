'use client';
import { useState } from 'react';

const HOURS = [
  { value: 0, label: '자시 (23:00~01:00)' },
  { value: 2, label: '축시 (01:00~03:00)' },
  { value: 4, label: '인시 (03:00~05:00)' },
  { value: 6, label: '묘시 (05:00~07:00)' },
  { value: 8, label: '진시 (07:00~09:00)' },
  { value: 10, label: '사시 (09:00~11:00)' },
  { value: 12, label: '오시 (11:00~13:00)' },
  { value: 14, label: '미시 (13:00~15:00)' },
  { value: 16, label: '신시 (15:00~17:00)' },
  { value: 18, label: '유시 (17:00~19:00)' },
  { value: 20, label: '술시 (19:00~21:00)' },
  { value: 22, label: '해시 (21:00~23:00)' },
];

const GAN_HAN = { 갑:'甲', 을:'乙', 병:'丙', 정:'丁', 무:'戊', 기:'己', 경:'庚', 신:'辛', 임:'壬', 계:'癸' };
const JI_HAN = { 자:'子', 축:'丑', 인:'寅', 묘:'卯', 진:'辰', 사:'巳', 오:'午', 미:'未', 신:'申', 유:'酉', 술:'戌', 해:'亥' };

const GAN_COLOR = {
  갑:'#008000', 을:'#008000',
  병:'#FF0000', 정:'#FF0000',
  무:'#FFD700', 기:'#FFD700',
  경:'#FFFFFF', 신:'#FFFFFF',
  임:'#000000', 계:'#000000',
};

const JI_COLOR = {
  자:'#000000', 축:'#FFD700', 인:'#008000', 묘:'#008000',
  진:'#FFD700', 사:'#FF0000', 오:'#FF0000', 미:'#FFD700',
  신:'#FFFFFF', 유:'#FFFFFF', 술:'#FFD700', 해:'#000000',
};

function GanTile({ gan }) {
  const bg = GAN_COLOR[gan] || '#555';
  const isLight = bg === '#FFFFFF' || bg === '#FFD700';
  return (
    <div style={{
      background: bg,
      color: isLight ? '#000' : '#fff',
      fontSize: 36,
      fontWeight: 700,
      width: 72,
      height: 72,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 6,
      border: '2px solid #333',
      margin: '0 auto 4px',
    }}>{GAN_HAN[gan] || gan}</div>
  );
}

function JiTile({ ji }) {
  const bg = JI_COLOR[ji] || '#555';
  const isLight = bg === '#FFFFFF' || bg === '#FFD700';
  return (
    <div style={{
      background: bg,
      color: isLight ? '#000' : '#fff',
      fontSize: 36,
      fontWeight: 700,
      width: 72,
      height: 72,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 6,
      border: '2px solid #333',
      margin: '0 auto',
    }}>{JI_HAN[ji] || ji}</div>
  );
}

export default function Home() {
  const [form, setForm] = useState({ year: '', month: '', day: '', hour: '8', gender: '남' });
  const [saju, setSaju] = useState(null);
  const [interpretation, setInterpretation] = useState('');
  const [loadingSaju, setLoadingSaju] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [error, setError] = useState('');

  const years = Array.from({ length: 100 }, (_, i) => 2005 - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

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
    } catch (err) {
      setError('오류: ' + err.message);
    } finally {
      setLoadingSaju(false);
    }
  }

  async function handleAI() {
    if (!saju) return;
    setLoadingAI(true);
    setInterpretation('');
    setError('');

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saju }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setInterpretation(data.result);
    } catch (err) {
      setError('AI 오류: ' + err.message);
    } finally {
      setLoadingAI(false);
    }
  }

  const pillars = saju ? [
    { label: '시주', gan: saju.hour.gan, ji: saju.hour.ji },
    { label: '일주', gan: saju.day.gan, ji: saju.day.ji },
    { label: '월주', gan: saju.month.gan, ji: saju.month.ji },
    { label: '연주', gan: saju.year.gan, ji: saju.year.ji },
  ] : [];

  return (
    <main style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: '-apple-system, sans-serif' }}>

      <div style={{ background: '#3a5bbf', color: '#fff', padding: '16px 20px' }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>운세인사이트</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.85 }}>AI 사주풀이</p>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px' }}>

        <div style={{ background: '#fff', borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px', color: '#333' }}>생년월일 입력</h2>

          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {['남', '여'].map(g => (
              <button key={g} onClick={() => setForm({ ...form, gender: g })} style={{
                flex: 1, padding: '9px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                border: '1.5px solid',
                borderColor: form.gender === g ? '#3a5bbf' : '#ddd',
                background: form.gender === g ? '#3a5bbf' : '#fff',
                color: form.gender === g ? '#fff' : '#666',
                cursor: 'pointer',
              }}>{g}성</button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
            {[
              { key: 'year', label: '년도', options: years, format: y => y + '년' },
              { key: 'month', label: '월', options: months, format: m => m + '월' },
              { key: 'day', label: '일', options: days, format: d => d + '일' },
            ].map(({ key, label, options, format }) => (
              <div key={key}>
                <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 4 }}>{label}</label>
                <select value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={inputStyle}>
                  <option value="">{label}</option>
                  {options.map(o => <option key={o} value={o}>{format(o)}</option>)}
                </select>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 4 }}>태어난 시간</label>
            <select value={form.hour} onChange={e => setForm({ ...form, hour: e.target.value })} style={{ ...inputStyle, width: '100%' }}>
              {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
            </select>
          </div>

          {error && <p style={{ color: '#e74c3c', fontSize: 13, margin: '0 0 12px' }}>{error}</p>}

          <button onClick={handleSaju} disabled={loadingSaju} style={{
            width: '100%', padding: '13px',
            background: loadingSaju ? '#aaa' : '#3a5bbf',
            color: '#fff', border: 'none', borderRadius: 10,
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
          }}>
            {loadingSaju ? '계산 중...' : '만세력 보기'}
          </button>
        </div>

        {saju && (
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>

            <div style={{ background: '#3a5bbf', color: '#fff', borderRadius: 8, padding: '12px 16px', marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>
                {form.gender === '남' ? '👨' : '👩'} {form.year}년 {form.month}월 {form.day}일생 ({form.gender}성)
              </div>
              <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>
                양력 {form.year}.{String(form.month).padStart(2,'0')}.{String(form.day).padStart(2,'0')}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 8 }}>
              {pillars.map(p => (
                <div key={p.label} style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#555' }}>
                  {p.label}
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 4 }}>
              {pillars.map(p => <GanTile key={p.label + 'g'} gan={p.gan} />)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
              {pillars.map(p => <JiTile key={p.label + 'j'} ji={p.ji} />)}
            </div>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20, fontSize: 12 }}>
              {[
                { color: '#008000', label: '木 (갑을인묘)' },
                { color: '#FF0000', label: '火 (병정사오)' },
                { color: '#FFD700', label: '土 (무기진술축미)', text: '#000' },
                { color: '#FFFFFF', label: '金 (경신신유)', text: '#000' },
                { color: '#000000', label: '水 (임계자해)' },
              ].map(o => (
                <div key={o.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 14, height: 14, borderRadius: 2, background: o.color, border: '1px solid #333' }} />
                  <span style={{ color: '#666' }}>{o.label}</span>
                </div>
              ))}
            </div>

            <button onClick={handleAI} disabled={loadingAI} style={{
              width: '100%', padding: '13px',
              background: loadingAI ? '#aaa' : '#e67e22',
              color: '#fff', border: 'none', borderRadius: 10,
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}>
              {loadingAI ? 'AI 분석 중...' : '✨ AI 사주풀이 받기'}
            </button>
          </div>
        )}

        {interpretation && (
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px', color: '#333' }}>✨ AI 사주풀이</h2>
            <div style={{ lineHeight: 1.9, fontSize: 14, color: '#444', whiteSpace: 'pre-wrap' }}>
              {interpretation}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

const inputStyle = {
  width: '100%',
  padding: '9px 10px',
  border: '1.5px solid #ddd',
  borderRadius: 8,
  fontSize: 14,
  color: '#333',
  background: '#fff',
  boxSizing: 'border-box',
};