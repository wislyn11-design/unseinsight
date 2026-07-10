import { GanTile, JiTile } from './Tiles.jsx';
import { getSipseong } from '../../lib/saju/sipseong.js';
import { get12un } from '../../lib/saju/un12.js';

const ROW_BORDER = { borderTop: '1px solid #e0e0e0' };

// 💡 흉살 목록 (여기에 포함되면 빨간색, 아니면 파란색으로 표시)
const HYUNGSIN = ['겁살','재살','천살','망신살','양인살','백호살','원진살','귀문관살','현침살','고란살','비인살','육해살','낙정관살','급각살','탕화살'];

function Row({ children, style }) {
  return (
    <div style={{ display: 'flex', ...ROW_BORDER, ...style }}>
      {children}
    </div>
  );
}

// 💡 Cell에 isCurrent 속성을 추가하여 배경색 처리를 간소화했습니다.
function Cell({ children, style, isCurrent }) {
  return (
    <div style={{
      flex: '0 0 48px', textAlign: 'center', padding: '4px 2px', fontSize: 13,
      background: isCurrent ? '#eef2ff' : 'transparent',
      ...style
    }}>
      {children}
    </div>
  );
}

function SmallGanTile({ gan }) {
  const GAN_COLOR = { 갑:'#008000', 을:'#008000', 병:'#FF0000', 정:'#FF0000', 무:'#FFD700', 기:'#FFD700', 경:'#FFFFFF', 신:'#FFFFFF', 임:'#000000', 계:'#000000' };
  const GAN_HAN = { 갑:'甲', 을:'乙', 병:'丙', 정:'丁', 무:'戊', 기:'己', 경:'庚', 신:'辛', 임:'壬', 계:'癸' };
  const bg = GAN_COLOR[gan] || '#555';
  const isLight = bg === '#FFFFFF' || bg === '#FFD700';
  return (
    <div style={{
      background: bg, color: isLight ? '#000' : '#fff', fontSize: 20, fontWeight: 700, width: 44, height: 44,
      display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: '2px solid #333', margin: '0 auto',
    }}>{GAN_HAN[gan] || gan}</div>
  );
}

function SmallJiTile({ ji }) {
  const JI_COLOR = { 자:'#000000', 축:'#FFD700', 인:'#008000', 묘:'#008000', 진:'#FFD700', 사:'#FF0000', 오:'#FF0000', 미:'#FFD700', 신:'#FFFFFF', 유:'#FFFFFF', 술:'#FFD700', 해:'#000000' };
  const JI_HAN = { 자:'子', 축:'丑', 인:'寅', 묘:'卯', 진:'辰', 사:'巳', 오:'午', 미:'未', 신:'申', 유:'酉', 술:'戌', 해:'亥' };
  const bg = JI_COLOR[ji] || '#555';
  const isLight = bg === '#FFFFFF' || bg === '#FFD700';
  return (
    <div style={{
      background: bg, color: isLight ? '#000' : '#fff', fontSize: 20, fontWeight: 700, width: 44, height: 44,
      display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: '2px solid #333', margin: '0 auto',
    }}>{JI_HAN[ji] || ji}</div>
  );
}

export default function Daeun({ daeun, dayGan, birthYear }) {
  if (!daeun || !daeun.daeuns || daeun.daeuns.length === 0) return null;

  const daeuns = daeun.daeuns;
  const currentYear = new Date().getFullYear();
  const internationalAge = birthYear ? currentYear - birthYear + 1 : null;

  const currentIdx = daeuns.findIndex((d, i) => {
    const next = daeuns[i + 1];
    return internationalAge >= d.startAge && (!next || internationalAge < next.startAge);
  });

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 10px', color: '#333', textAlign: 'center' }}>
  전통나이(대운수: {daeun.daeunSu}, {daeun.isForward ? '순행' : '역행'})
      </h2>

      <div style={{ overflowX: 'auto' }}>
        <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, overflow: 'hidden', minWidth: 'max-content' }}>

          <Row style={{ background: '#f5f7ff' }}>
            {daeuns.map((d, i) => (
              <Cell key={i} isCurrent={i === currentIdx} style={{
                fontWeight: 700, color: i === currentIdx ? '#fff' : '#3a5bbf', background: i === currentIdx ? '#3a5bbf' : 'transparent',
              }}>
                {d.startAge}
              </Cell>
            ))}
          </Row>

          <Row>
            {daeuns.map((d, i) => (
              <Cell key={i} isCurrent={i === currentIdx} style={{ color: '#555', fontSize: 12 }}>
                {getSipseong(dayGan, d.gan)}
              </Cell>
            ))}
          </Row>

          <Row>
            {daeuns.map((d, i) => (
              <Cell key={i} isCurrent={i === currentIdx} style={{ outline: i === currentIdx ? '2px solid #3a5bbf' : 'none' }}>
                <SmallGanTile gan={d.gan} />
              </Cell>
            ))}
          </Row>

          <Row>
            {daeuns.map((d, i) => (
              <Cell key={i} isCurrent={i === currentIdx} style={{ outline: i === currentIdx ? '2px solid #3a5bbf' : 'none' }}>
                <SmallJiTile ji={d.ji} />
              </Cell>
            ))}
          </Row>

          <Row>
            {daeuns.map((d, i) => (
              <Cell key={i} isCurrent={i === currentIdx} style={{ color: '#7c3aed', fontWeight: 700, fontSize: 12 }}>
                {get12un(dayGan, d.ji)}
              </Cell>
            ))}
          </Row>

          {/* 💡 [새로 추가] 대운 신살 3줄 출력 */}
          {[0, 1, 2].map(rowIdx => (
            <Row key={'sinsal'+rowIdx}>
              {daeuns.map((d, i) => {
                const salName = d.sinsal ? d.sinsal[rowIdx] : null;
                const isHyung = HYUNGSIN.includes(salName);
                return (
                  <Cell key={i} isCurrent={i === currentIdx} style={{ 
                    color: isHyung ? '#e74c3c' : '#2563eb', 
                    fontSize: 11, fontWeight: 600, letterSpacing: '-0.5px' 
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