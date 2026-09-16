import { useEffect, useState } from "react";
import { useConfigurator } from "../../hooks/useConfigurator";
import { calculateTotalPrice } from "../../config/calculateTotalPrice";
import styles from "./TotalPrice.module.css";

export default function TotalPrice() {
  const { selected } = useConfigurator();

  const totalPrice = calculateTotalPrice(selected);

  const [previousPrice, setPreviousPrice] = useState(totalPrice);
  const [priceChange, setPriceChange] = useState(null);

  useEffect(() => {
    if (totalPrice === previousPrice) return;

    setPriceChange(totalPrice - previousPrice);
    setPreviousPrice(totalPrice);

    const timer = setTimeout(() => {
      setPriceChange(null);
    }, 800);

    return () => clearTimeout(timer);
  }, [totalPrice, previousPrice]);

  return (
    <div className={styles.container}>
      {priceChange !== null && priceChange !== 0 && (
        <div
          key={`${totalPrice}-${priceChange}`}
          className={`${styles.priceChange} ${
            priceChange > 0 ? styles.increase : styles.decrease
          }`}
        >
          {priceChange > 0 ? "+" : ""}
          {priceChange.toLocaleString("sv-SE")} SEK
        </div>
      )}

      <div className={styles.total}>
        {totalPrice.toLocaleString("sv-SE")}{" "}
        <span className={styles.sek}>SEK</span>
      </div>
    </div>
  );
}
