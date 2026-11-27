import styles from "./candle-sprite.module.css";

export default function CandleSprite({ celebrating = false, effectId = 0 }: { celebrating?: boolean; effectId?: number }) {
  return (
    <span className={`${styles.sprite} ${celebrating ? styles.celebrating : ""}`} aria-hidden="true">
      <span className={styles.halo} />
      <img className={styles.body} src="/wish/items/candle-body.png" alt="" draggable={false} />
      <span className={styles.flame}>
        <img className={styles.flameImage} src="/wish/items/candle-flame.png" alt="" draggable={false} />
      </span>
      {celebrating && <span key={effectId} className={styles.sparkGroup}><span className={styles.spark}>✦</span><span className={`${styles.spark} ${styles.second}`}>✦</span><span className={`${styles.spark} ${styles.third}`}>✧</span></span>}
    </span>
  );
}
