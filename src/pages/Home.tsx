import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="home-container">
      <section className="category-section">
        <h2 className="category-title">一般</h2>
        <div className="features-grid">
          <Link to="/timer" className="feature-card">
            <div className="feature-icon">⏱️</div>
            <h3>タイマー</h3>
          </Link>

          <Link to="/scramble" className="feature-card">
            <div className="feature-icon">🎲</div>
            <h3>スクランブラー</h3>
          </Link>
        </div>
      </section>

      <section className="category-section">
        <h2 className="category-title">4x4x4 UDセンター</h2>
        <div className="features-grid">
          <Link to="/white-yellow-utilities" className="feature-card">
            <div className="feature-icon">🔧</div>
            <h3>ハッシュ確認</h3>
          </Link>

          <Link to="/ud-center-solver-check" className="feature-card">
            <div className="feature-icon">⚖️</div>
            <h3>ソルバー比較</h3>
          </Link>

          <Link to="/solution-check" className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>解確認</h3>
          </Link>

          <Link to="/ud-center-scramble" className="feature-card">
            <div className="feature-icon">🔀</div>
            <h3>UDセンタースクランブラー</h3>
          </Link>

          <Link to="/minimal-hash-check" className="feature-card">
            <div className="feature-icon">🔢</div>
            <h3>最小ハッシュ確認</h3>
          </Link>
        </div>
      </section>

      <style>{`
        .home-container {
          min-height: 100vh;
          padding: 2rem;
          background: linear-gradient(135deg, #1a1a2e 0%, #0a0a1e 100%);
        }

        .category-section {
          max-width: 1200px;
          margin: 0 auto 2rem;
        }

        .category-title {
          font-size: 1.25rem;
          color: #9ca3af;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 2rem;
          text-decoration: none;
          color: inherit;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(10px);
        }

        .feature-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
          border-color: rgba(102, 126, 234, 0.3);
        }

        .feature-card:hover::before {
          opacity: 1;
        }

        .feature-icon {
          font-size: 2.5rem;
          margin-bottom: 1rem;
          filter: brightness(1.2);
        }

        .feature-card h3 {
          font-size: 1.5rem;
          margin-bottom: 0;
          color: #e5e7eb;
          position: relative;
          z-index: 1;
        }

        .nav-header {
          padding: 1rem 2rem;
          background: rgba(0, 0, 0, 0.2);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .back-link {
          color: #9ca3af;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: color 0.2s ease;
        }

        .back-link:hover {
          color: #667eea;
        }

        @media (max-width: 960px) {
          .features-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .features-grid {
            grid-template-columns: 1fr;
          }

          .home-container {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
}

export default Home;