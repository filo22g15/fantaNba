// Route admin-only: scarica ruolo (sports.ws) e contratto (Spotrac) per un giocatore.
// Gira come funzione serverless su Vercel (IP datacenter → l'anti-bot può bloccare).
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { syncPlayer, urlSpotrac } from '@/lib/scrape';
import type { League } from '@/lib/league/types';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Solo gli admin' }, { status: 403 });

  const { name, linkOnly } = (await req.json().catch(() => ({}))) as {
    name?: string;
    linkOnly?: boolean;
  };
  if (!name) return NextResponse.json({ error: 'Nome mancante' }, { status: 400 });

  try {
    // Solo link: risolve unicamente l'URL del profilo (1 richiesta, non tocca contratto/ruolo).
    if (linkOnly) {
      const spotracUrl = await urlSpotrac(name);
      return NextResponse.json({ spotracUrl, found: !!spotracUrl });
    }
    const { data: row } = await supabase.from('league_state').select('data').eq('id', 1).single();
    const seasons = ((row?.data as League)?.seasons as string[]) || [];
    const res = await syncPlayer(name, seasons);
    return NextResponse.json(res);
  } catch {
    return NextResponse.json(
      { error: 'Scraping bloccato o fallito (probabile anti-bot). Riprova più tardi o usa lo script locale.' },
      { status: 502 }
    );
  }
}
