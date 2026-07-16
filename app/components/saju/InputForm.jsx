import { useRef } from 'react';

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

function timeToHourValue(timeStr) {
  if (!timeStr) return -1;
  const t = timeStr.replace(':', '');
  if (t.length < 3) return -1;
  const h = parseInt(t.slice(0, t.length - 2));
  const m = parseInt(t.slice(-2));
  if (isNaN(h) || isNaN(m)) return -1;
  let total = h * 60 + m - 30;
  if (total < 0) total += 24 * 60;
  if (total >= 23 * 60 || total < 1 * 60) return 0;
  if (total < 3 * 60) return 2;
  if (total < 5 * 60) return 4;
  if (total < 7 * 60) return 6;
  if (total < 9 * 60) return 8;
  if (total < 11 * 60) return 10;
  if (total < 13 * 60) return 12;
  if (total < 15 * 60) return 14;
  if (total < 17 * 60) return 16;
  if (total < 19 * 60) return 18;
  if (total < 21 * 60) return 20;
  if (total < 23 * 60) return 22;
  return 0;
}

function isYajasiTime(timeStr) {
  if (!timeStr || timeStr.length < 4) return false;
  const h = parseInt(timeStr.slice(0, timeStr.length - 2));
  const m = parseInt(timeStr.slice(-2));
  if (isNaN(h) || isNaN(m)) return false;
  // 자시(23:00~01:00) 범위에서만 야자시 옵션 표시
  return (h === 23) || (h === 0);
}

const HOUR_LABELS = {
  0: '자시 (23:00~01:00)', 2: '축시 (01:00~03:00)', 4: '인시 (03:00~05:00)',
  6: '묘시 (05:00~07:00)', 8: '진시 (07:00~09:00)', 10: '사시 (09:00~11:00)',
  12: '오시 (11:00~13:00)', 14: '미시 (13:00~15:00)', 16: '신시 (15:00~17:00)',
  18: '유시 (17:00~19:00)', 20: '술시 (19:00~21:00)', 22: '해시 (21:00~23:00)',
};

export default function InputForm({ form, setForm, onSubmit, loading, error }) {
  const monthRef = useRef(null);
  const dayRef   = useRef(null);
  const hourRef  = useRef(null);

// 💡 [여기 추가!] 숫자를 '00시 00분' 형태로 예쁘게 포장해 주는 함수
const formatTimeDisplay = (value) => {
  if (!value) return '';
  const onlyNumbers = value.toString().replace(/[^0-9]/g, ''); 
  if (onlyNumbers.length === 0) return '';
  if (onlyNumbers.length <= 2) return `${onlyNumbers}시`;
  return `${onlyNumbers.slice(0, 2)}시 ${onlyNumbers.slice(2, 4)}분`;
};


  const hourLabel = form.hour === '-1' || form.hour === -1 ? '모름' : HOUR_LABELS[Number(form.hour)] || '';
  const showYajasi = form.hourInput && form.hourInput.length === 4 && isYajasiTime(form.hourInput);

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px', color: '#333' }}>생년월일 입력</h2>

      {/* 성별 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
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

      {/* 양력/음력 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {['양력', '음력'].map(t => (
          <button key={t} onClick={() => setForm({ ...form, calType: t, isLeap: false })} style={{
            flex: 1, padding: '9px', borderRadius: 8, fontSize: 14, fontWeight: 600,
            border: '1.5px solid',
            borderColor: form.calType === t ? '#e67e22' : '#ddd',
            background: form.calType === t ? '#e67e22' : '#fff',
            color: form.calType === t ? '#fff' : '#666',
            cursor: 'pointer',
          }}>{t}</button>
        ))}
      </div>

      {/* 윤달 */}
      {form.calType === '음력' && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#555', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.isLeap}
              onChange={e => setForm({ ...form, isLeap: e.target.checked })}
              style={{ width: 16, height: 16 }} />
            윤달
          </label>
        </div>
      )}

      {/* 날짜 */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 6 }}>생년월일</label>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {/* 년도 - 4자리 입력시 월로 이동 */}
          <input
            type="text"
            inputMode="numeric"        // 추가
            pattern="[0-9]*"           // 추가
            placeholder="년도"
            value={form.year}
            onChange={e => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 4);
              setForm({ ...form, year: val });
              if (val.length === 4) monthRef.current?.focus();
            }}
            style={{ ...inputStyle, width: 90, textAlign: 'center' }}
          />
          <span style={{ color: '#888', fontSize: 13, flexShrink: 0 }}>년</span>

          {/* 월 - 2자리 입력시 일로 이동 */}
          <input
            ref={monthRef}
            type="text"
            inputMode="numeric"        // 추가
            pattern="[0-9]*"           // 추가
            placeholder="월"
            value={form.month}
            onChange={e => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 2);
              setForm({ ...form, month: val });
              if (val.length === 2) dayRef.current?.focus();
            }}
            style={{ ...inputStyle, width: 54, textAlign: 'center' }}
          />
          <span style={{ color: '#888', fontSize: 13, flexShrink: 0 }}>월</span>

          {/* 일 - 2자리 입력시 시간으로 이동 */}
          <input
            ref={dayRef}
            type="text"
            inputMode="numeric"        // 추가
            pattern="[0-9]*"           // 추가
            placeholder="일"
            value={form.day}
            onChange={e => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 2);
              setForm({ ...form, day: val });
              if (val.length === 2) hourRef.current?.focus();
            }}
            style={{ ...inputStyle, width: 54, textAlign: 'center' }}
          />
          <span style={{ color: '#888', fontSize: 13, flexShrink: 0 }}>일</span>
        </div>
      </div>

      {/* 시간 직접 입력 */}
      <div style={{ marginBottom: showYajasi ? 8 : 16 }}>
        <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 6 }}>
          태어난 시간 (24시간 형식, 예: 1315)
        </label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            ref={hourRef}
            type="text"
            inputMode="numeric"        // 추가
            pattern="[0-9]*"           // 추가
            placeholder="시간 입력 (예: 0930)"
            value={formatTimeDisplay(form.hourInput)}
            onChange={e => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 4);
              const hourVal = val.length === 4 ? timeToHourValue(val) : -1;
              setForm({ ...form, hourInput: val, hour: hourVal, yajasi: false });
            }}
            style={{ ...inputStyle, flex: 1, textAlign: 'center' }}
          />
          <button
            onClick={() => setForm({ ...form, hourInput: '', hour: -1, yajasi: false })}
            style={{
              padding: '9px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              border: '1.5px solid',
              borderColor: form.hour === -1 ? '#3a5bbf' : '#ddd',
              background: form.hour === -1 ? '#3a5bbf' : '#fff',
              color: form.hour === -1 ? '#fff' : '#666',
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >모름</button>
        </div>
        {form.hourInput && form.hourInput.length === 4 && (
          <div style={{ fontSize: 12, color: '#3a5bbf', marginTop: 4 }}>
            → {hourLabel}
          </div>
        )}
      </div>

      {/* 야자시 토글 */}
      {showYajasi && (
        <div style={{
          marginBottom: 16,
          padding: '10px 14px',
          background: '#f8f4ff',
          borderRadius: 8,
          border: '1.5px solid #c9b8f0',
        }}>
          <div style={{ fontSize: 13, color: '#555', marginBottom: 8, fontWeight: 600 }}>
            야자시(夜子時) 적용 여부
          </div>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>
            23:00 이후 출생 시 다음날 자시로 볼 것인지 선택하세요
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { label: '미적용 (당일 자시)', value: false },
              { label: '적용 (다음날 자시)', value: true },
            ].map(opt => (
              <button
                key={String(opt.value)}
                onClick={() => setForm({ ...form, yajasi: opt.value })}
                style={{
                  flex: 1, padding: '8px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  border: '1.5px solid',
                  borderColor: form.yajasi === opt.value ? '#7c4dff' : '#ddd',
                  background: form.yajasi === opt.value ? '#7c4dff' : '#fff',
                  color: form.yajasi === opt.value ? '#fff' : '#666',
                  cursor: 'pointer',
                }}
              >{opt.label}</button>
            ))}
          </div>
        </div>
      )}

      {error && <p style={{ color: '#e74c3c', fontSize: 13, margin: '0 0 12px' }}>{error}</p>}

      <button onClick={onSubmit} disabled={loading} style={{
        width: '100%', padding: '13px', background: loading ? '#aaa' : '#3a5bbf',
        color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer',
      }}>
        {loading ? '계산 중...' : '만세력 보기'}
      </button>
    </div>
  );
}