// Route (utenti loggati): statistiche fantasy di un giocatore dalla pagina pubblica
// sports.ws/nba/<slug>. On-demand, nessun dato salvato. Come sync-player, gira come
// funzione serverless su Vercel (IP datacenter → l'anti-bot può bloccare).
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { playerStats } from '@/lib/scrape';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Cache CDN: risposte ripetute per lo stesso giocatore non ricolpiscono sports.ws.
const CACHE = 'public, s-maxage=1800, stale-while-revalidate=86400';

async function handle(name: string | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  if (!name?.trim()) return NextResponse.json({ error: 'Nome mancante' }, { status: 400 });

  try {
    const stats = await playerStats(name.trim());
    return NextResponse.json(stats, { headers: { 'Cache-Control': CACHE } });
  } catch {
    return NextResponse.json(
      { error: 'Statistiche non disponibili al momento (probabile anti-bot). Riprova più tardi.' },
      { status: 502 }
    );
  }
}

export async function GET(req: Request) {
  return handle(new URL(req.url).searchParams.get('name'));
}

export async function POST(req: Request) {
  const { name } = (await req.json().catch(() => ({}))) as { name?: string };
  return handle(name ?? null);
}
