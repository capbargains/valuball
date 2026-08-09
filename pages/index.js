import React, { useState, useEffect } from 'react';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    loadFavorites();
    fetchGames();
    const interval = setInterval(fetchGames, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/odds');
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to fetch');

      setGames(data.games);
      setLastUpdated(new Date(data.lastUpdated).toLocaleTimeString());
      setError(null);
    } catch (err) {
      setError('Failed to load games. Try refreshing.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (gameId) => {
    setFavorites(prev => {
      const updated = prev.includes(gameId)
        ? prev.filter(id => id !== gameId)
        : [...prev, gameId];
      localStorage.setItem('mlbFavorites', JSON.stringify(updated));
      return updated;
    });
  };

  const loadFavorites = () => {
    const saved = localStorage.getItem('mlbFavorites');
    if (saved) setFavorites(JSON.parse(saved));
  };

  const generateBullets = (game) => {
    const bullets = [];

    if (game.valueType === 'sharp') {
      const valueSideTeam = game.valueSide === 'home' ? game.homeTeam : game.awayTeam;
      const sharpBook = game.allBooks.find(b => ['pinnacle', 'betfair'].includes(b.key));
      const squareBook = game.allBooks.find(b => ['draftkings', 'fanduel', 'betmgm'].includes(b.key));

      if (sharpBook && squareBook) {
        bullets.push(
          `Sharp reverse: Pinnacle favors ${valueSideTeam}, but DraftKings/FanDuel taking opposite side`
        );
      }
    }

    if (game.bookCount >= 3) {
      bullets.push(
        `Line discrepancy: Best odds for ${game.valueSide === 'home' ? game.homeTeam : game.awayTeam} available at select books (+5 to +10 value)`
      );
    }

    const favProb = game.valueSide === 'home' ? game.homeProb : game.awayProb;
    if (favProb > 65 && favProb < 75) {
      bullets.push(
        `Underdog premium: Square money chasing big favorite, missing subtle value on other side`
      );
    } else if (favProb < 45) {
      bullets.push(
        `Public fade opportunity: Market underestimating ${game.valueSide === 'home' ? game.homeTeam : game.awayTeam}'s chances`
      );
    } else {
      bullets.push(
        `Close matchup with edge: Sharp and square money split — opportunity in discrepancy`
      );
    }

    return bullets.slice(0, 3);
  };

  const formatTime = (isoTime) => {
    const date = new Date(isoTime);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Best value plays today</h1>
        <p className={styles.subtitle}>Sharp vs square edge opportunities</p>

        <div className={styles.controls}>
          <button onClick={fetchGames} className={styles.refreshBtn}>
            ↻ Refresh
          </button>
          {lastUpdated && <span className={styles.lastUpdated}>Updated: {lastUpdated}</span>}
        </div>

        <div className={styles.gamesList}>
          {loading ? (
            <div className={styles.loading}>Loading games...</div>
          ) : error ? (
            <div className={styles.error}>{error}</div>
          ) : games.length === 0 ? (
            <div className={styles.empty}>No high-value games found today</div>
          ) : (
            games.map(game => {
              const isFav = favorites.includes(game.id);
              const bullets = generateBullets(game);

              return (
                <div key={game.id} className={`${styles.gameCard} ${isFav ? styles.favorited : ''}`}>
                  <div className={styles.gameHeader}>
                    <div>
                      <p className={styles.gameTime}>{formatTime(game.commenceTime)}</p>
                      <p className={styles.matchup}>
                        {game.awayTeam} @ {game.homeTeam}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleFavorite(game.id)}
                      className={`${styles.starBtn} ${isFav ? styles.starred : ''}`}
                    >
                      {isFav ? '★' : '☆'}
                    </button>
                  </div>

                  <div className={styles.odds}>
                    <div className={styles.oddsPair}>
                      <span className={styles.team}>{game.awayTeam}</span>
                      <span className={styles.odds_value}>{game.awayOdds > 0 ? '+' : ''}{game.awayOdds}</span>
                      <span className={styles.prob}>{game.awayProb}%</span>
                    </div>
                    <div className={styles.oddsPair}>
                      <span className={styles.team}>{game.homeTeam}</span>
                      <span className={styles.odds_value}>{game.homeOdds > 0 ? '+' : ''}{game.homeOdds}</span>
                      <span className={styles.prob}>{game.homeProb}%</span>
                    </div>
                  </div>

                  <div className={styles.valueIndicator}>
                    <span className={styles.valueBadge}>
                      {game.valueType === 'sharp' ? '🔥 SHARP REVERSE' : '📊 LINE VALUE'}
                    </span>
                  </div>

                  <div className={styles.bullets}>
                    {bullets.map((bullet, idx) => (
                      <div key={idx} className={styles.bullet}>
                        <span className={styles.bulletIcon}>•</span>
                        <span className={styles.bulletText}>{bullet}</span>
                      </div>
                    ))}
                  </div>

                  <div className={styles.footer}>
                    <span className={styles.bookCount}>From {game.bookCount} books</span>
                    <span className={styles.edge}>EV Edge Detected</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className={styles.info}>
          <p>💡 These games show +EV opportunities based on sharp vs square money splits and line discrepancies. Star your picks to track them.</p>
        </div>
      </div>
    </div>
  );
}
