import styles from "./OptionCard.module.css";

function OptionCard({ title, children }) {
  return (
    <div className={styles.optionCard}>
      <div className={styles.cardInfo}>
        <div className={styles.titleContainer}>
          {title && <h3 className={styles.title}>{title}</h3>}
        </div>
        {children}
      </div>
    </div>
  );
}

export default OptionCard;
