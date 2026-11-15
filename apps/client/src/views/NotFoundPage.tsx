import { useNavigate } from 'react-router-dom';

import { MikotoLogo } from '@/components/icons';
import { Button } from '@/design';

import styles from './NotFoundPage.module.css';

export function NotFound() {
  const navigate = useNavigate();
  return (
    <main className={styles.page}>
      <div className={styles.sheet}>
        <div className={styles.logo}>
          <MikotoLogo size={20} />
        </div>
        <p className={styles.code}>Error 404</p>
        <h1 className={styles.title}>This page doesn't exist</h1>
        <p className={styles.text}>
          The link may be broken, or the page may have moved. Check the address
          or head back to Mikoto.
        </p>
        <div className={styles.actions}>
          <Button variant="primary" onClick={() => navigate('/')}>
            Go to Mikoto
          </Button>
          {window.history.length > 1 && (
            <Button variant="ghost" onClick={() => navigate(-1)}>
              Go back
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
