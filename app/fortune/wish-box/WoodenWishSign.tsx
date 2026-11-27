import styles from "./wooden-wish-sign.module.css";
export default function WoodenWishSign({ wish, disabled, onEdit }: { wish: string; disabled: boolean; onEdit: () => void }) {
  return (
    <button type="button" className={styles.sign} disabled={disabled} onClick={(event) => { event.stopPropagation(); onEdit(); }} title={wish || "소원 적기"} aria-label={wish ? `소원: ${wish}. 눌러서 전체 보기와 수정` : "간판에 소원 적기"}>
      <img src="/wish/items/wish-sign-banner.png" alt="" draggable={false} />
      <span className={styles.writing}><span>{wish || "이곳에 소원을 적어주세요"}</span></span>
      <span className={styles.edit}>✎</span>
    </button>
  );
}
