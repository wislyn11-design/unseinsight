import PillarCell, { GILSIN, HYUNGSIN } from './PillarCard.jsx';
import { JI_HAN } from './Tiles.jsx';
import OhaengInfo from './OhaengInfo.jsx';
import React, { useState } from 'react'; // 💡 useState가 꼭 있어야 버튼이 작동합니다!


const ROW_BORDER = { borderTop: '1px solid #e0e0e0' };
const GRID = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' };

function Row({ children, style }) {
  return <div style={{ ...GRID, ...ROW_BORDER, ...style }}>{children}</div>;
}

const ROW_TARGET = ['day', 'month', 'hour', 'year'];


function getRelBetween(myPillar, targetPillar, allPillars) {
  const myJi = myPillar.ji;
  const targetJi = targetPillar.ji;
  if (!myJi || !targetJi) return null;
  if (myPillar.label === targetPillar.label) return null;
  if (myJi === targetJi && !['진','오','유','해'].includes(myJi)) return null;

  const jaHyungList = ['진', '오', '유', '해'];
  if (myJi === targetJi && jaHyungList.includes(myJi)) return '형';

  const relationMap = myPillar.relationMap || {};
  const rels = [];

  Object.entries(relationMap).forEach(([rel, partners]) => {
    if (['충', '형', '파', '해', '육합', '삼합', '방합', '원진', '귀문', '천라', '지망'].includes(rel)) return;
    if (partners.includes(targetJi) && !rels.includes(rel)) rels.push(rel);
  });

  const hyungPairList = [['인','사'], ['사','신'], ['인','신'], ['축','술'], ['술','미'], ['축','미'], ['자','묘']];
  if (hyungPairList.some(([a, b]) => (myJi === a && targetJi === b) || (myJi === b && targetJi === a)) && !rels.includes('형')) rels.push('형');

  const chungPairList = [['자','오'], ['축','미'], ['인','신'], ['묘','유'], ['진','술'], ['사','해']];
  if (chungPairList.some(([a, b]) => (myJi === a && targetJi === b) || (myJi === b && targetJi === a)) && !rels.includes('충')) rels.push('충');

  const yukHapPairList = [['자','축'], ['인','해'], ['묘','술'], ['진','유'], ['사','신'], ['오','미']];
  if (yukHapPairList.some(([a, b]) => (myJi === a && targetJi === b) || (myJi === b && targetJi === a)) && !rels.includes('육합')) rels.push('육합');

  const samhapGroups = [['해','묘','미'], ['인','오','술'], ['사','유','축'], ['신','자','진']];
  if (samhapGroups.some(g => g.includes(myJi) && g.includes(targetJi)) && !rels.includes('삼합')) rels.push('삼합');

  const banghapGroups = [['해','자','축'], ['인','묘','진'], ['사','오','미'], ['신','유','술']];
  if (banghapGroups.some(g => g.includes(myJi) && g.includes(targetJi)) && !rels.includes('방합')) rels.push('방합');

  const paPairList = [['자','유'], ['축','진'], ['인','해'], ['묘','오'], ['사','신'], ['술','미']];
  if (paPairList.some(([a, b]) => (myJi === a && targetJi === b) || (myJi === b && targetJi === a)) && !rels.includes('파')) rels.push('파');

  const haePairList = [['자','미'], ['축','오'], ['인','사'], ['묘','진'], ['신','해'], ['유','술']];
  if (haePairList.some(([a, b]) => (myJi === a && targetJi === b) || (myJi === b && targetJi === a)) && !rels.includes('해')) rels.push('해');

  // 정통 5대 암합 로직
  const amhapPairList = [['자','술'], ['축','인'], ['인','미'], ['묘','신'], ['오','해']];
  if (amhapPairList.some(([a, b]) => (myJi === a && targetJi === b) || (myJi === b && targetJi === a)) && !rels.includes('암합')) {
    rels.push('암합');
  }

  const wonjinPairList = [['자','미'], ['축','오'], ['인','유'], ['묘','신'], ['진','해'], ['사','술']];
  if (wonjinPairList.some(([a, b]) => (myJi === a && targetJi === b) || (myJi === b && targetJi === a)) && !rels.includes('원진')) rels.push('원진');

  const gwimunPairList = [['자','유'], ['축','오'], ['인','미'], ['묘','신'], ['진','해'], ['사','술']];
  if (gwimunPairList.some(([a, b]) => (myJi === a && targetJi === b) || (myJi === b && targetJi === a)) && !rels.includes('귀문')) rels.push('귀문');

  // 💡 [핵심 추가] 천라지망 로직
  if (((myJi === '술' && targetJi === '해') || (myJi === '해' && targetJi === '술')) && !rels.includes('천라')) {
    rels.push('천라');
  }
  if (((myJi === '진' && targetJi === '사') || (myJi === '사' && targetJi === '진')) && !rels.includes('지망')) {
    rels.push('지망');
  }

  if (rels.length === 0) return null;

  const groupA = ['방합','삼합','육합','암합'];
  rels.sort((a, b) => (groupA.indexOf(a) > -1 ? -1 : 1) - (groupA.indexOf(b) > -1 ? -1 : 1));

  let result = [...rels];
  const newResult = [];

  if (result.includes('암합') && result.includes('원진') && result.includes('귀문')) {
    result = result.filter(r => r !== '암합' && r !== '원진' && r !== '귀문');
    newResult.push('암합,원진,귀문');
  } else if (result.includes('원진') && result.includes('귀문')) {
    result = result.filter(r => r !== '원진' && r !== '귀문');
    newResult.push('원진,귀문');
  }
  if (result.includes('충') && result.includes('형')) {
    result = result.filter(r => r !== '충' && r !== '형');
    newResult.push('충,형');
  }
  if (result.includes('파') && result.includes('귀문')) {
    result = result.filter(r => r !== '파' && r !== '귀문');
    newResult.push('파,귀문');
  }

  const finalResult = [...newResult, ...result];

  let filteredResult = finalResult;
  if (targetPillar.label === '년주' || targetPillar.label === '연주') {
    filteredResult = finalResult.filter(r => r !== '충');
  }

  // 💡 [여기 추가!] 천을귀인 앱과 동일한 출력 순서를 강제하는 정렬 로직
  const SORT_ORDER = ['삼합', '방합', '육합', '충', '원진', '귀문', '형', '파', '해', '암합'];
  filteredResult.sort((a, b) => {
    const indexA = SORT_ORDER.indexOf(a) !== -1 ? SORT_ORDER.indexOf(a) : 99;
    const indexB = SORT_ORDER.indexOf(b) !== -1 ? SORT_ORDER.indexOf(b) : 99;
    return indexA - indexB;
  });

  const grouped = [];
  let i = 0;
  while (i < filteredResult.length) {
    if ((filteredResult[i] === '형' || filteredResult[i] === '파') && 
        (filteredResult[i+1] === '형' || filteredResult[i+1] === '파')) {
      grouped.push('형,파'); i += 2;
    } else {
      grouped.push(filteredResult[i]); i++;
    }
  }

  return grouped.join(',') || null;
}


export default function SajuTable({ saju, form }) {

  const [showAllSinsal, setShowAllSinsal] = useState(false);

  const pillars = {
    hour:  { label: '시주', ...saju.hour },
    day:   { label: '일주', ...saju.day },
    month: { label: '월주', ...saju.month },
    year:  { label: '연주', ...saju.year },

  };

  // 💡 [새로 추가] 배열이든 문자열이든 안전하게 한자로 변환해주는 도우미 함수
  const toHanja = (data) => {
    if (!data) return '';
    // 데이터가 배열(Array)이면 글자로 합치고, 아니면 그냥 문자열로 만듭니다.
    const str = Array.isArray(data) ? data.join('') : String(data);
    const map = {
      '자':'子','축':'丑','인':'寅','묘':'卯','진':'辰','사':'巳','오':'午','미':'未','신':'申','유':'酉','술':'戌','해':'亥',
      '갑':'甲','을':'乙','병':'丙','정':'丁','무':'戊','기':'己','경':'庚','신':'辛','임':'壬','계':'癸'
    };
    return str.split('').map(c => map[c] || c).join('');
  };


  const pillarOrder = ['hour', 'day', 'month', 'year'];
  const pillarList = pillarOrder.map(k => pillars[k]);
  const isHourUnknown = Number(form.hour) === -1;
  const dayGan = saju.day.gan;

  const maxJJG = Math.max(...pillarList.map(p => (p.jijanggan || []).length));
  const maxSinsal = Math.max(...pillarList.map(p => (p.sinsal || []).filter(s => GILSIN.includes(s) || HYUNGSIN.includes(s)).length));

  // 👇 [이렇게 변경] 맨 끝에 allPillars={pillarList} 추가!
  const cell = (type, rowIndex = 0) => pillarList.map((p) => (
  <PillarCell key={p.label} type={type} pillar={p} dayGan={dayGan} isUnknown={isHourUnknown && p.label === '시주'} rowIndex={rowIndex} allPillars={pillarList} />
));

  const CHUNG_TYPES = ['충', '형', '파', '해', '원진', '귀문', '천라', '지망', '암합', '충,형', '형,파', '파,귀문', '해,원진', '해,원진,귀문', '원진,귀문', '육합,파', '암합,원진,귀문'];
  const arrowTypes = { hour: '→', day: '←→', month: '←→', year: '←' };

  const grid = {};
  pillarOrder.forEach(myKey => {
    grid[myKey] = ['', '', '', ''];
    ROW_TARGET.forEach((targetKey, rowIdx) => {
      if (myKey === targetKey) {
        const ji = pillars[myKey].ji;
        const jiHan = JI_HAN[ji] || ji; // 한자 표기 적용
        const arrow = arrowTypes[myKey];
        grid[myKey][rowIdx] = arrow === '→' ? `HAN:(${jiHan})→` : (arrow === '←' ? `HAN:←(${jiHan})` : `HAN:←(${jiHan})→`);
      } else {
        grid[myKey][rowIdx] = getRelBetween(pillars[targetKey], pillars[myKey], pillarList) || '-';
      }
    });
  });

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
      {/* ... (상단 정보창 영역) ... */}
      <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, overflow: 'hidden' }}>
        <Row style={{ background: '#f5f7ff' }}>{cell('label')}</Row>
        <Row>{cell('name')}</Row>
        <Row>{cell('chung')}</Row>
        <Row>{cell('sipseong')}</Row>
        <Row>{cell('ganTile')}</Row>
        <Row>{cell('jiTile')}</Row>
        <Row>{cell('jiSipseong')}</Row>
        {Array.from({ length: maxJJG }).map((_, i) => <Row key={'jjg'+i} style={{ background: '#fffbe6' }}>{cell('jijanggan', i)}</Row>)}
        <Row>{cell('un12')}</Row>
        <Row>{cell('naeum')}</Row>
        {Array.from({ length: 4 }).map((_, lineIdx) => (
          <div key={'rel'+lineIdx} style={{ ...GRID, ...ROW_BORDER, background: '#fffbe6' }}>
            {pillarOrder.map(pk => {
              const slot = grid[pk][lineIdx];
              if (slot.startsWith('HAN:')) return <div key={pk} style={{ textAlign: 'center', padding: '5px 2px', fontSize: 14, color: '#1a56db', fontWeight: 700 }}>{slot.replace('HAN:', '')}</div>;
              return (
                <div key={pk} style={{ textAlign: 'center', padding: '5px 2px', fontSize: 14, color: slot.split(',').some(r => CHUNG_TYPES.includes(r)) ? '#e74c3c' : '#2563eb', fontWeight: 600 }}>
                  {slot === '-' ? '-' : slot}
                </div>
              );
            })}
          </div>
        ))}
      </div>

{/* ======================================================= */}
      
      {/* 1. 오행 개수 출력 */}
      <div style={{ borderTop: '1px solid #ddd', padding: '6px', textAlign: 'center', fontSize: '15px', background: '#fff' }}>
        木 {saju?.ohaengCount?.['목'] || 0}, 火 {saju?.ohaengCount?.['화'] || 0}, 土 {saju?.ohaengCount?.['토'] || 0}, 金 {saju?.ohaengCount?.['금'] || 0}, 水 {saju?.ohaengCount?.['수'] || 0}
      </div>

      {/* 2. 공망 및 천을귀인/월령 출력 (안전한 한자 변환 필터 적용) */}
      <div style={{ borderTop: '1px solid #ddd', padding: '6px', textAlign: 'center', fontSize: '15px', background: '#fff', lineHeight: '1.7' }}>
        <div>
          空亡: [年]{toHanja(saju?.yearGongmang)} [日]{toHanja(saju?.dayGongmang)}
        </div>
        <div>
          天乙貴人: {toHanja(saju?.cheonEul)}, 月令: {toHanja(saju?.wolRyeong)}
        </div>
      </div>


      {/* 3. 신살 제목 및 [전체보기] 토글 버튼 UI (범례 추가) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#eef2ff', borderTop: '2px solid #ddd' }}>
        <div>
          <span style={{ fontWeight: 'bold', color: '#333', fontSize: '15px' }}>신살(神殺)</span>
          <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>(파랑: 길신, 빨강: 흉살)</span>
        </div>
        <button 
          onClick={() => setShowAllSinsal(!showAllSinsal)}
          style={{ 
            padding: '4px 10px', fontSize: '13px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s',
            border: showAllSinsal ? '1px solid #3a5bbf' : '1px solid #aaa', 
            background: showAllSinsal ? '#3a5bbf' : '#fff', 
            color: showAllSinsal ? '#fff' : '#555' 
          }}
        >
          {showAllSinsal ? '핵심 신살' : '전체 신살 보기'}
        </button>
      </div>

      {/* 4. 신살 출력 영역 (기둥별 공망 표시 추가) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: '#f9f9f9', paddingBottom: '10px' }}>
        
        {/* 💡 [새로 추가] 기둥별 공망 표시 (천을귀인 앱의 - - - [일]공망 역할) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridColumn: '1 / -1', borderBottom: '1px dashed #ccc', marginBottom: '4px' }}>
          {[pillars.hour, pillars.day, pillars.month, pillars.year].map((p, idx) => {
            let gmText = '-';
            if (p && p.ji) {
              const isYearGm = saju?.yearGongmang?.includes(p.ji);
              const isDayGm = saju?.dayGongmang?.includes(p.ji);
              if (isYearGm && isDayGm) gmText = '[年/日]공망';
              else if (isYearGm) gmText = '[年]공망';
              else if (isDayGm) gmText = '[日]공망';
            }
            return (
              <div key={idx} style={{ textAlign: 'center', padding: '6px 0', fontSize: '14px', color: gmText !== '-' ? '#333' : '#aaa', fontWeight: gmText !== '-' ? 'bold' : 'normal' }}>
                {gmText}
              </div>
            );
          })}
        </div>

        {/* 신살 데이터 출력 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridColumn: '1 / -1' }}>{cell('sinsal', 0)}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridColumn: '1 / -1' }}>{cell('sinsal', 1)}</div>
        
        {/* 버튼을 눌렀을 때만 아래 줄들이 펼쳐집니다 */}
        {showAllSinsal && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridColumn: '1 / -1' }}>{cell('sinsal', 2)}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridColumn: '1 / -1' }}>{cell('sinsal', 3)}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridColumn: '1 / -1' }}>{cell('sinsal', 4)}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridColumn: '1 / -1' }}>{cell('sinsal', 5)}</div>
          </>
        )}
      </div>
      {/* ======================================================= */}


    </div>
  );
}