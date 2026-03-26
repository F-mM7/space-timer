import { Link } from 'react-router-dom';

const styles = {
  nav: {
    padding: '12px 24px',
    backgroundColor: '#1e1e2e',
    borderBottom: '1px solid #333',
  },
  link: {
    color: '#888',
    textDecoration: 'none',
    fontSize: '14px',
  },
} as const;

export function PageHeader() {
  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.link}>
        ← ホームへ戻る
      </Link>
    </nav>
  );
}
