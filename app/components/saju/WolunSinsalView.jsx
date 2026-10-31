import { getSipseong } from '../../lib/saju/sipseong.js';
import { get12un } from '../../lib/saju/un12.js';
import { getWolun } from '../../lib/saju/wolun.js';
import { getSeun } from '../../lib/saju/seun.js';
import { getTransitSinsalNames } from '../../lib/saju/transit-sinsal-adapter.js';

const ROW_BORDER = { borderTop: '1px solid #e5ebf4' };

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
      fontSize: 26, fontWeight: 700, width: 54, height: 54,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: 8, border: '1.5px solid #263a5b', margin: '0 auto',
    }}>{GAN_HAN[gan] || gan}</div>
  );
}

function SmallJiTile({ ji }) {
  const bg = JI_COLOR[ji] || '#555';
  const isLight = bg === '#FFFFFF' || bg === '#FFD700';
  return (
    <div style={{
      background: bg, color: isLight ? '#000' : '#fff',
      fontSize: 26, fontWeight: 700, width: 54, height: 54,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: 8, border: '1.5px solid #263a5b', margin: '0 auto',
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
      // 💡 flex: 1과 minWidth: '48px'로 수정하여 공평하게 늘어나게 합니다!
      flex: 1, minWidth: '72px', 
      textAlign: 'center', padding: '10px 5px', fontSize: 17,
      background: isCurrent ? '#eef2ff' : 'transparent',
      ...style
    }}>
      {children}
    </div>
  );
}

// 👇👇👇 💡 [여기에 새로 추가!] 지지를 천간으로 변환해 십성을 구하는 함수 👇👇👇
function getJiSipseong(dayGan, ji) {
  const jiToGan = {
    '자': '계', '축': '기', '인': '갑', '묘': '을',
    '진': '무', '사': '병', '오': '정', '미': '기',
    '신': '경', '유': '신', '술': '무', '해': '임'
  };
  const convertedGan = jiToGan[ji];
  return convertedGan ? getSipseong(dayGan, convertedGan) : '';
}



// 💡 [수정됨] dayGan 대신 saju 객체 전체를 받습니다.
export default function WolunSinsalView({ saju }) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const seuns = getSeun(currentYear, 1);
  const currentSeun = seuns[0];
  
  // 💡 월운 데이터를 가져온 뒤, 사주 원국을 바탕으로 신살을 덧붙입니다.
  const rawMonths = getWolun(currentYear, currentSeun.gan, currentSeun.ji);
  const months = rawMonths.map(w => {
    const sinsal = getTransitSinsalNames(
      saju,
      { gan: w.gan, ji: w.ji, type: 'wolun' },
      saju.gender,
    );
    return { ...w, sinsal };
  });

  const dayGan = saju.day.gan;

  return (
    <div style={{ background: '#fff', borderRadius: 20, padding: 22, marginBottom: 0, border: '1px solid #dfe7f3', boxShadow: '0 10px 28px rgba(35, 61, 112, 0.05)' }}>
      <h2 style={{ fontSize: 23, fontWeight: 800, margin: '0 0 16px', color: '#263a5b', textAlign: 'left' }}>
        {currentYear}년 월운
      </h2>

      <div style={{ overflowX: 'auto' }}>
        {/* 💡 width: '100%'를 추가하여 웹 화면에 꽉 차게 만듭니다! */}
        <div style={{ border: '1px solid #e1e8f2', borderRadius: 12, overflow: 'hidden', minWidth: 'max-content', width: '100%' }}>

          <Row style={{ background: '#f4f7fc' }}>
            {months.map((w, i) => {
              const isCurrent = w.month === currentMonth;
              return (
                <Cell key={i} isCurrent={isCurrent} style={{
                  fontWeight: isCurrent ? 700 : 400,
                  color: isCurrent ? '#3a5bbf' : '#555',
                  outline: isCurrent ? '2px solid #3a5bbf' : 'none',
                  fontSize: 17,
                }}>
                  {w.month}월
                </Cell>
              );
            })}
          </Row>

          <Row>
            {months.map((w, i) => (
              <Cell key={i} isCurrent={w.month === currentMonth} style={{ color: '#555', fontSize: 17 }}>
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

        {/* 👇👇👇 💡 [여기에 새로 추가!] 아래쪽 한자(지지)의 십성 👇👇👇 */}
        <Row>
            {months.map((w, i) => (
              <Cell key={i} isCurrent={w.month === currentMonth} style={{ color: '#555', fontSize: 17 }}>
                {getJiSipseong(dayGan, w.ji)}
              </Cell>
            ))}
          </Row>
          {/* 👆👆👆 ========================================= 👆👆👆 */}


          <Row>
            {months.map((w, i) => (
              <Cell key={i} isCurrent={w.month === currentMonth} style={{ color: '#7c3aed', fontWeight: 700, fontSize: 17 }}>
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
                    fontSize: 17, fontWeight: 600, letterSpacing: '-0.5px' 
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
