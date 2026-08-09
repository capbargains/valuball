export default async function handler(req, res) {
  const apiKey = process.env.ODDS_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/baseball_mlb/odds?regions=us&markets=h2h,spreads,totals&oddsFormat=american&apiKey=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`The Odds API error: ${response.status}`);
    }

    const data = await response.json();
    
    const valuePlays = data.events
      .filter(event => {
        return new Date(event.commence_time) > new Date();
      })
      .map(event => {
        const h2hMarket = event.bookmakers[0]?.markets.find(m => m.key === 'h2h');
        if (!h2hMarket) return null;

        const outcomes = h2hMarket.outcomes;
        const homeTeam = event.home_team;
        const awayTeam = event.away_team;
        
        const oddsToProb = (odds) => {
          if (odds < 0) {
            return Math.abs(odds) / (Math.abs(odds) + 100);
          } else {
            return 100 / (odds + 100);
          }
        };

        const homeOdds = outcomes.find(o => o.name === homeTeam).price;
        const awayOdds = outcomes.find(o => o.name === awayTeam).price;

        const homeProb = oddsToProb(homeOdds);
        const awayProb = oddsToProb(awayOdds);

        const allBooks = event.bookmakers.map(book => {
          const market = book.markets.find(m => m.key === 'h2h');
          if (!market) return null;
          const homeOutcome = market.outcomes.find(o => o.name === homeTeam);
          const awayOutcome = market.outcomes.find(o => o.name === awayTeam);
          return {
            book: book.title,
            key: book.key,
            homeOdds: homeOutcome?.price,
            awayOdds: awayOutcome?.price,
          };
        }).filter(Boolean);

        const sharpBooks = ['pinnacle', 'betfair'];
        const squareBooks = ['draftkings', 'fanduel', 'betmgm'];

        const sharpBook = allBooks.find(b => sharpBooks.includes(b.key));
        const squareBook = allBooks.find(b => squareBooks.includes(b.key));

        let valueSide = null;
        let valueType = null;

        if (sharpBook && squareBook) {
          const sharpHomeProb = oddsToProb(sharpBook.homeOdds);
          const squareHomeProb = oddsToProb(squareBook.homeOdds);

          if (sharpHomeProb > squareHomeProb + 0.05) {
            valueSide = 'home';
            valueType = 'sharp';
          } else if (sharpHomeProb < squareHomeProb - 0.05) {
            valueSide = 'away';
            valueType = 'sharp';
          }
        }

        const bestHomeOdds = Math.max(...allBooks.map(b => b.homeOdds || -1000));
        const bestAwayOdds = Math.max(...allBooks.map(b => b.awayOdds || -1000));

        return {
          id: event.id,
          homeTeam,
          awayTeam,
          commenceTime: event.commence_time,
          homeOdds,
          awayOdds,
          homeProb: Math.round(homeProb * 100),
          awayProb: Math.round(awayProb * 100),
          valueSide,
          valueType,
          bookCount: allBooks.length,
          bestLines: {
            homeOdds: bestHomeOdds,
            awayOdds: bestAwayOdds,
          },
          allBooks,
          quality: Math.abs(homeProb - 0.5) > 0.1 ? 6 : 8,
        };
      })
      .filter(Boolean)
      .filter(game => game.valueSide)
      .sort((a, b) => {
        if (a.valueType === 'sharp' && b.valueType !== 'sharp') return -1;
        return b.quality - a.quality;
      })
      .slice(0, 5);

    return res.status(200).json({
      games: valuePlays,
      lastUpdated: new Date().toISOString(),
      requestsRemaining: data.remaining,
    });
  } catch (error) {
    console.error('Error fetching odds:', error);
    return res.status(500).json({ error: 'Failed to fetch odds data' });
  }
}
