import { GanTile, JiTile, EmptyTile, GAN_HAN } from './Tiles.jsx';

const CHEONGAN = ['갑','을','병','정','무','기','경','신','임','계'];
const SIPSEONG_LIST = ['비견','겁재','식신','상관','편재','정재','편관','정관','편인','정인'];
export const GILSIN = ['천을귀인','천덕귀인','월덕귀인','태극귀인','암록','금여','학당귀인','문창귀인'];
export const HYUNGSIN = ['겁살','재살','천살','지살','년살','월살','망신살','장성살','반안살','역마살','화개살','백호살','양인살','홍염살','도화살','고란살','귀문관살','원진살'];

const JI_TO_GAN = {
  '자': '계', '축': '기', '인': '갑', '묘': '을', '진': '무',
  '사': '병', '오': '정', '미': '기', '신': '경', '유': '신',
  '술': '무', '해': '임'
};

export function getSipseongLabel(ilgan, target, isJiji = false) {
  const targetGan = isJiji ? (JI_TO_GAN[target] || target) : target;
  
  const ilIdx = CHEONGAN.indexOf(ilgan);
  const tIdx = CHEONGAN.indexOf(targetGan);
  if (ilIdx === -1 || tIdx === -1) return '';

  const ilElement = Math.floor(ilIdx / 2);
  const tElement = Math.floor(tIdx / 2);
  
  const ilPolarity = ilIdx % 2;
  const tPolarity = tIdx % 2;

  const relation = (tElement - ilElement + 5) % 5;
  const isDifferentPolarity = ilPolarity !== tPolarity ? 1 : 0;
  
  return SIPSEONG_LIST[relation * 2 + isDifferentPolarity];
}

export const CELL = { textAlign: 'center', padding: '6px 2px', fontSize: 16 };

export default function PillarCell({ type, pillar, dayGan, isUnknown, rowIndex, allPillars }) {
  if (type === 'label') return (
    <div style={{ ...CELL, fontWeight: 700, color: '#555' }}>{pillar.label}</div>
  );

  if (type === 'name') return (
    <div style={{ ...CELL, color: '#777' }}>
      {isUnknown ? '(?)' : `(${pillar.gan}${pillar.ji})`}
    </div>
  );

  
  if (type === 'chung') {
    if (isUnknown) return <div style={{ ...CELL, color: '#555', fontWeight: 400, minHeight: 30 }}>-</div>;

    const hapPairs = [['갑','기'], ['을','경'], ['병','신'], ['정','임'], ['무','계']];
    const chungPairs = [['갑','경'], ['을','신'], ['병','임'], ['정','계'], ['갑','무'], ['을','기'], ['무','임'], ['기','계'], ['병','경'], ['정','신']];

    const isPairMatch = (pairs, a, b) => pairs.some(p => (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a));

    let results = [];

    if (allPillars && allPillars.length > 0) {
      // 💡 [핵심 수정] 천을귀인 앱과 똑같이 '왼쪽(시주) -> 오른쪽(년주/연주)' 방향으로 검사 순서를 강력하게 고정
      const order = ['시주', '일주', '월주', '년주', '연주']; 
      const sortedOthers = [...allPillars].sort((a, b) => {
        const indexA = order.indexOf(a.label) !== -1 ? order.indexOf(a.label) : 99;
        const indexB = order.indexOf(b.label) !== -1 ? order.indexOf(b.label) : 99;
        return indexA - indexB;
      });

      sortedOthers.forEach(otherPillar => {
        // 자기 자신은 제외
        if (otherPillar.label !== pillar.label && otherPillar.gan && otherPillar.gan !== '?') {
          const a = pillar.gan;
          const b = otherPillar.gan;
          
          if (isPairMatch(hapPairs, a, b)) {
            results.push('합');
          } else if (isPairMatch(chungPairs, a, b)) {
            results.push('충');
          }
        }
      });
    }

    const result = results.length > 0 ? results.join('') : '-';

    return (
      <div style={{ ...CELL, color: result !== '-' ? '#e74c3c' : '#555', fontWeight: result !== '-' ? 700 : 400, minHeight: 30 }}>
        {result}
      </div>
    );
  }


  if (type === 'sipseong') return (
    <div style={{
      ...CELL,
      color: pillar.sipseong === '일간(나)' ? '#3a5bbf' : '#333',
      fontWeight: pillar.sipseong === '일간(나)' ? 700 : 400,
    }}>
      {pillar.sipseong}
    </div>
  );

  if (type === 'ganTile') return (
    <div style={{ ...CELL }}>
      {isUnknown ? <EmptyTile /> : <GanTile gan={pillar.gan} />}
    </div>
  );

  if (type === 'jiTile') return (
    <div style={{ ...CELL }}>
      {isUnknown ? <EmptyTile /> : <JiTile ji={pillar.ji} />}
    </div>
  );

  if (type === 'jiSipseong') {
    const sipseong = pillar.jiSipseong || getSipseongLabel(dayGan, pillar.ji, true);
    return (
      <div style={{ ...CELL, color: '#555' }}>
        {isUnknown ? '' : sipseong}
      </div>
    );
  }

  if (type === 'jijanggan') {
    const g = isUnknown ? null : (pillar.jijanggan || [])[rowIndex];
    return (
      <div style={{ ...CELL, background: '#fffbe6', color: '#555', minHeight: 30 }}>
        {g ? `${GAN_HAN[g] || g} ${getSipseongLabel(dayGan, g, false)}` : ''}
      </div>
    );
  }

  if (type === 'un12') return (
    <div style={{ ...CELL, color: '#7c3aed', fontWeight: 700 }}>
      {isUnknown ? '' : pillar.un12}
      {!isUnknown && pillar.un12Self ? (
        <div style={{ fontSize: 16, color: '#9f7aea', fontWeight: 400 }}>
          ({pillar.un12Self})
        </div>
      ) : null}
    </div>
  );

  if (type === 'naeum') return (
    <div style={{ ...CELL, color: '#888' }}>
      {isUnknown ? '' : pillar.naeum}
    </div>
  );

  if (type === 'other') {
    const other = (pillar.chungHyung || []).filter(c => c !== '충');
    return (
      <div style={{ ...CELL, color: '#e74c3c', fontWeight: 700 }}>
        {!isUnknown && other.length > 0 ? other.join(' ') : ''}
      </div>
    );
  }

  if (type === 'sinsal') {
    const all = isUnknown ? [] : [
      ...(pillar.sinsal || []).filter(s => GILSIN.includes(s)),
      ...(pillar.sinsal || []).filter(s => HYUNGSIN.includes(s)),
    ];
    const s = all[rowIndex];
    const isGil = s && GILSIN.includes(s);
    return (
      <div style={{ ...CELL, color: isGil ? '#2563eb' : '#dc2626', fontWeight: 700, minHeight: 30 }}>
        {s || ''}
      </div>
    );
  }

  return <div style={CELL} />;
}