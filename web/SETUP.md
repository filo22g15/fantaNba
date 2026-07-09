# FantaNBA webapp — setup & deploy

App **Next.js 16** (App Router) + **Supabase** (Postgres + Auth + RLS), gratis, per ~20 utenti.
La webapp è nella sottocartella **`web/`**; gli script Python nella root restano strumenti locali.

Supabase già configurato: project ref `ecpokgyqeckkvowameyx`
(URL `https://ecpokgyqeckkvowameyx.supabase.co`). Le 3 chiavi sono in `web/.env.local`.

---

## Sviluppo locale

Node.js **portabile** in `../tools/node` (nessuna installazione di sistema):

```powershell
$env:PATH = "C:\Users\filippogi\Desktop\fantaNba\tools\node;" + $env:PATH
cd web
npm run dev      # http://localhost:3000
```

---

## Deploy su Vercel (gratis)

### 1. Porta il codice su GitHub
Il commit c'è già in locale; manca il push. Verifica che `web/.env.local` NON sia tracciato
(è in `.gitignore`), poi:

```powershell
cd C:\Users\filippogi\Desktop\fantaNba
git push        # su origin/main (repo filo22g15/fantaNba)
```

### 2. Crea il progetto su Vercel
1. https://vercel.com → accedi con **GitHub** (piano **Hobby**, gratis).
2. **Add New… → Project** → importa il repo `filo22g15/fantaNba`.
3. **Root Directory: `web`** ← IMPORTANTISSIMO (l'app è nella sottocartella; clicca "Edit" e scegli `web`).
4. Framework: **Next.js** (rilevato in automatico). Lascia i comandi di default.

### 3. Variabili d'ambiente (Vercel → Project → Settings → Environment Variables)
Copia i 3 valori **da `web/.env.local`** e incollali (ambiente: **Production** e **Preview**):

| Name | Valore |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ecpokgyqeckkvowameyx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (anon key da `.env.local`) |
| `SUPABASE_SERVICE_ROLE_KEY` | (service_role da `.env.local` — spunta "Sensitive") |

### 4. Deploy
Premi **Deploy**. A build finita avrai un URL tipo `https://fantanba.vercel.app`.
(Ogni futuro `git push` su `main` ridistribuisce da solo.)

### 5. Aggiorna gli URL di Auth su Supabase (necessario per il login online)
Supabase → **Authentication → URL Configuration**:
- **Site URL**: `https://<tuo-progetto>.vercel.app`
- **Redirect URLs**: aggiungi `https://<tuo-progetto>.vercel.app/**`
  (tieni anche `http://localhost:3000/**` per lo sviluppo locale)

### 6. Invita i 20 utenti
Login **invito-only**: l'utente deve esistere prima.
- Supabase → **Authentication → Users → Add user** (email + password, spunta *Auto Confirm*),
  oppure **Invite user** (magic link via email).
- Comunica a ciascuno le credenziali; al primo accesso sceglie **nome (GM) + squadra**.
- Tu resti admin. Per promuovere un altro admin: **SQL Editor**
  `update public.profiles set role='admin' where id=(select id from auth.users where email='x@y.it');`

### 7. Verifica
Apri l'URL Vercel → login → controlla Contratti/Squadre/Trade. In incognito prova un account membro.

---

## Note importanti
- **Vercel Hobby** = uso non-commerciale (fantalega tra amici = ok).
- **Supabase Free** va in pausa dopo ~1 settimana di inattività → primo accesso con qualche
  secondo di cold-start. Normale.
- **Email magic-link**: l'invio integrato di Supabase ha limiti bassi; per invii affidabili a
  regime si può configurare uno SMTP (Auth → Emails). Per l'uso saltuario di 20 persone di solito basta.
- **Bottoni 🔄 / 🔗 (scraping Spotrac) su Vercel**: girano da IP datacenter → l'anti-bot li
  bloccherà spesso. Online usali con parsimonia; per aggiornamenti massicci usa gli **script locali**
  (sotto), che girano dal tuo IP di casa.

---

## Pipeline Python ↔ DB (locale)

Contratti da Spotrac, ruoli da sports.ws, link diretti. Fonte di verità = il DB, quindi il giro è
**DB → data.js → scraper → DB**:

```powershell
$env:SUPABASE_URL="https://ecpokgyqeckkvowameyx.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="<service_role da .env.local>"
$env:PYTHONIOENCODING="utf-8"

python pull_from_db.py                              # DB -> data.js / bacheca.js
python sincronizza.py --solo-contratti "Nome"      # ruolo+contratto (free agent)
python link_spotrac.py                             # link diretti Spotrac (ripetibile; anti-bot ~26/volta)
python push_to_db.py                               # data.js -> DB   (--dry-run per provare)
```

**Regola d'oro:** esegui `pull_from_db.py` prima di scrapare, così non sovrascrivi le modifiche
fatte online dall'admin.
