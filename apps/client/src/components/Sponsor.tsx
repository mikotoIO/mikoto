import { HandCoins } from 'lucide-react';

import styles from './Sponsor.module.css';

export function SponsoredFeature() {
  return (
    <a className={styles.card} href="#">
      <span className={styles.icon} aria-hidden>
        <HandCoins size={18} />
      </span>
      <span>
        <span className={styles.label}>Sponsored feature</span>
        <span className={styles.title}>Improved onboarding</span>
        <span className={styles.text}>
          Want it sooner? Sponsor it for yourself and everyone else, from $10.
        </span>
      </span>
    </a>
  );
}
