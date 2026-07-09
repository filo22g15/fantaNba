// Test manuale del parser: node --import tsx scripts/test-player-stats.ts "Jaylen Brown"
import { playerStats } from '../lib/scrape';

async function main() {
  const nome = process.argv[2] || 'Jaylen Brown';
  const s = await playerStats(nome);
  console.log(
    JSON.stringify(
      {
        found: s.found,
        slug: s.slug,
        season: s.season,
        header: s.header,
        season_line: s.season_line,
        last5: s.last5,
        last10: s.last10,
        last20: s.last20,
        monthly: s.monthly,
        games: s.gamelog.length,
        firstGame: s.gamelog[0],
        lastGame: s.gamelog[s.gamelog.length - 1],
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error('ERRORE:', e);
  process.exit(1);
});
