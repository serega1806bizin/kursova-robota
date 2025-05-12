import styles from './Footer.module.scss';
import { Link } from 'react-router-dom';

export const Footer = () => {
  const scrollToTop = () => {
    document.body.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.footer__container}>
        <div className={styles.footer__linksContainer}>
          <Link
            to="https://t.me/ZAMYR_l"
            target="_blank"
            className={styles.footer__link}
          >
            Замовити ПЗ
          </Link>
          <Link
            to="https://t.me/ZAMYR_l"
            target="_blank"
            className={styles.footer__link}
          >
            замовити сайт
          </Link>
          <Link
            to="https://t.me/ZAMYR_l"
            target="_blank"
            className={styles.footer__link}
          >
            Рішення для вашого бізнесу
          </Link>
        </div>
        <div className={styles.footer__backToTop}>
          <button
            className={styles.footer__backToTopText}
            onClick={() => scrollToTop()}
          >
            НА ПОЧАТОК
          </button>

          <button
            className={styles.footer__backToTopButton}
            onClick={() => scrollToTop()}
          />
        </div>
      </div>
    </footer>
  );
};
