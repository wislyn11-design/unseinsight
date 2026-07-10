import { getSipseong } from '../../lib/saju/sipseong.js';
import { get12un } from '../../lib/saju/un12.js';
import { getWolun } from '../../lib/saju/wolun.js';
import { getSeun } from '../../lib/saju/seun.js';
import { getSinsal } from '../../lib/saju/sinsal.js'; // 💡 신살 계산 엔진 추가

const ROW_BORDER = { borderTop: '1px solid #e0e0e0' };

// 💡 흉살 목록 (여기에 포함되면 빨간색, 아니면 파란색으로 표시)
const HYUNGSIN = ['겁살','재살','천살','망신살','양인살','백호살','원진살','귀문관살','현침살','고란살','비인살','육해살','낙정관살','급각살','탕화살'];

const GAN_COLOR = {
  갑:'#008000', 을:'#008000', 병:'#FF0000', 정:'#FF0000',
  무:'#FFD700', 기:'#FFD700', 경:'#FFFFFF', 신:'#FFFFFF',
  임:'#000000', 계:'#000000',
};
const GAN_HAN = { 갑:'甲', 을:'乙', 병:'丙', 정:'丁', 무:'戊', 기:'己', 경:'庚', 신:'辛', 임:'壬', 계:'癸' };
const JI_COLOR = {
  자:'#000000', 축:'#FFD700', 인:'#008000', 묘:'#008000',
  진:'#FFD700', 사:'#FF0000', 오:'#FF0000', 미:'#FFD700',
  신:'#FFFFFF', 유:'#FFFFFF', 술:'#FFD700', 해:'#000000',
};
const JI_HAN = { 자:'子', 축:'丑', 인:'寅', 묘:'卯', 진:'辰', 사:'巳', 오:'午', 미:'未', 신:'申', 유:'酉', 술:'戌', 해:'亥' };

function SmallGanTile({ gan }) {
  const bg = GAN_COLOR[gan] || '#555';
  const isLight = bg === '#FFFFFF' || bg === '#FFD700';
  return (
    <div style={{
      background: bg, color: isLight ? '#000' : '#fff',
      fontSize: 20, fontWeight: 700, width: 44, height: 44,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: 4, border: '1.5px solid #333', margin: '0 auto',
    }}>{GAN_HAN[gan] || gan}</div>
  );
}

function SmallJiTile({ ji }) {
  const bg = JI_COLOR[ji] || '#555';
  const isLight = bg === '#FFFFFF' || bg === '#FFD700';
  return (
    <div style={{
      background: bg, color: isLight ? '#000' : '#fff',
      fontSize: 20, fontWeight: 700, width: 44, height: 44,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: 4, border: '1.5px solid #333', margin: '0 auto',
    }}>{JI_HAN[ji] || ji}</div>
  );
}

function Row({ children, style }) {
  return (
    <div style={{ display: 'flex', ...ROW_BORDER, ...style }}>
      {children}
    </div>
  );
}

function Cell({ children, style, isCurrent }) {
  return (
    <div style={{
      flex: '0 0 48px', textAlign: 'center', padding: '4px 2px', fontSize: 15,
      background: isCurrent ? '#eef2ff' : 'transparent',
      ...style
    }}>
      {children}
    </div>
  );
}

// 💡 [수정됨] dayGan 대신 saju 객체 전체를 받습니다.
export default function Wolun({ saju }) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const seuns = getSeun(currentYear, 1);
  const currentSeun = seuns[0];
  
  // 💡 월운 데이터를 가져온 뒤, 사주 원국을 바탕으로 신살을 덧붙입니다.
  const rawMonths = getWolun(currentYear, currentSeun.gan, currentSeun.ji);
  const months = rawMonths.map(w => {
    // 월운의 글자(w.gan, w.ji)를 시주 자리에 넣어 신살을 판별합니다.
    const wSinsal = getSinsal(saju.year.gan, saju.year.ji, saju.month.gan, saju.month.ji, saju.day.gan, saju.day.ji, w.gan, w.ji);
    return { ...w, sinsal: wSinsal.hour }; 
  });

  const dayGan = saju.day.gan;

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 10px', color: '#333', textAlign: 'center' }}>
        {currentYear}년 월운
      </h2>

      <div style={{ overflowX: 'auto' }}>
        <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, overflow: 'hidden', minWidth: 'max-content' }}>

          <Row style={{ background: '#f5f7ff' }}>
            {months.map((w, i) => {
              const isCurrent = w.month === currentMonth;
              return (
                <Cell key={i} isCurrent={isCurrent} style={{
                  fontWeight: isCurrent ? 700 : 400,
                  color: isCurrent ? '#3a5bbf' : '#555',
                  outline: isCurrent ? '2px solid #3a5bbf' : 'none',
                  fontSize: 11,
                }}>
                  {w.month}월
                </Cell>
              );
            })}
          </Row>

          <Row>
            {months.map((w, i) => (
              <Cell key={i} isCurrent={w.month === currentMonth} style={{ color: '#555', fontSize: 14 }}>
                {getSipseong(dayGan, w.gan)}
              </Cell>
            ))}
          </Row>

          <Row>
            {months.map((w, i) => (
              <Cell key={i} isCurrent={w.month === currentMonth}>
                <SmallGanTile gan={w.gan} />
              </Cell>
            ))}
          </Row>

          <Row>
            {months.map((w, i) => (
              <Cell key={i} isCurrent={w.month === currentMonth}>
                <SmallJiTile ji={w.ji} />
              </Cell>
            ))}
          </Row>

          <Row>
            {months.map((w, i) => (
              <Cell key={i} isCurrent={w.month === currentMonth} style={{ color: '#7c3aed', fontWeight: 700, fontSize: 11 }}>
                {get12un(dayGan, w.ji)}
              </Cell>
            ))}
          </Row>

          {/* 💡 [새로 추가] 월운 신살 3줄 출력 */}
          {[0, 1, 2].map(rowIdx => (
            <Row key={'sinsal'+rowIdx}>
              {months.map((w, i) => {
                const salName = w.sinsal ? w.sinsal[rowIdx] : null;
                const isHyung = HYUNGSIN.includes(salName);
                return (
                  <Cell key={i} isCurrent={w.month === currentMonth} style={{ 
                    color: isHyung ? '#e74c3c' : '#2563eb', 
                    fontSize: 13, fontWeight: 600, letterSpacing: '-0.5px' 
                  }}>
                    {salName || ''}
                  </Cell>
                );
              })}
            </Row>
          ))}

        </div>
      </div>
    </div>
  );
}