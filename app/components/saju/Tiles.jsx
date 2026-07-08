export const GAN_HAN = { 갑:'甲', 을:'乙', 병:'丙', 정:'丁', 무:'戊', 기:'己', 경:'庚', 신:'辛', 임:'壬', 계:'癸' };
export const JI_HAN = { 자:'子', 축:'丑', 인:'寅', 묘:'卯', 진:'辰', 사:'巳', 오:'午', 미:'未', 신:'申', 유:'酉', 술:'戌', 해:'亥' };

export const GAN_COLOR = {
  갑:'#008000', 을:'#008000', 병:'#FF0000', 정:'#FF0000',
  무:'#FFD700', 기:'#FFD700', 경:'#FFFFFF', 신:'#FFFFFF',
  임:'#000000', 계:'#000000',
};

export const JI_COLOR = {
  자:'#000000', 축:'#FFD700', 인:'#008000', 묘:'#008000',
  진:'#FFD700', 사:'#FF0000', 오:'#FF0000', 미:'#FFD700',
  신:'#FFFFFF', 유:'#FFFFFF', 술:'#FFD700', 해:'#000000',
};

export function GanTile({ gan }) {
  const bg = GAN_COLOR[gan] || '#555';
  const isLight = bg === '#FFFFFF' || bg === '#FFD700';
  return (
    <div style={{
      background: bg, color: isLight ? '#000' : '#fff',
      fontSize: 36, fontWeight: 700, width: 72, height: 72,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: 6, border: '2px solid #333', margin: '0 auto',
    }}>{GAN_HAN[gan] || gan}</div>
  );
}

export function JiTile({ ji }) {
  const bg = JI_COLOR[ji] || '#555';
  const isLight = bg === '#FFFFFF' || bg === '#FFD700';
  return (
    <div style={{
      background: bg, color: isLight ? '#000' : '#fff',
      fontSize: 36, fontWeight: 700, width: 72, height: 72,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: 6, border: '2px solid #333', margin: '0 auto',
    }}>{JI_HAN[ji] || ji}</div>
  );
}

export function EmptyTile() {
  return (
    <div style={{
      width: 72, height: 72, background: '#eee', border: '2px dashed #aaa',
      borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
      margin: '0 auto', fontSize: 12, color: '#999',
    }}>모름</div>
  );
}