const JI_HAN = { 자:'子', 축:'丑', 인:'寅', 묘:'卯', 진:'辰', 사:'巳', 오:'午', 미:'未', 신:'申', 유:'酉', 술:'戌', 해:'亥' };

export default function OhaengInfo({ ohaengCount, yearGongmang, dayGongmang }) {
  return (
    <div>
      {/* 오행 개수 */}
      {ohaengCount && (
        <div style={{
          background: '#f8f8f8', borderRadius: 8, padding: '10px 14px',
          marginTop: 16, fontSize: 14, color: '#444', textAlign: 'center',
        }}>
          木 {ohaengCount.목} , 火 {ohaengCount.화} , 土 {ohaengCount.토} , 金 {ohaengCount.금} , 水 {ohaengCount.수}
        </div>
      )}

      {/* 공망 */}
      {yearGongmang && (
        <div style={{ fontSize: 13, color: '#666', textAlign: 'center', marginTop: 8 }}>
          空亡 [年] {yearGongmang.map(j => JI_HAN[j] || j).join('')} &nbsp;
          [日] {dayGongmang.map(j => JI_HAN[j] || j).join('')}
        </div>
      )}

      {/* 오행 범례 */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '16px 0', fontSize: 12 }}>
        {[
          { color: '#008000', label: '木' },
          { color: '#FF0000', label: '火' },
          { color: '#FFD700', label: '土' },
          { color: '#FFFFFF', label: '金' },
          { color: '#000000', label: '水' },
        ].map(o => (
          <div key={o.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 14, height: 14, borderRadius: 2, background: o.color, border: '1px solid #333' }} />
            <span style={{ color: '#666' }}>{o.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}