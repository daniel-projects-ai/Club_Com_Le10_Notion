import { useState, useEffect } from 'react'
import { mockData } from '../mockData'

const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5001'
  : 'https://clubcomle10notion-production.up.railway.app'

const PER_PAGE = 8          // jusqu'à 8 opportunités affichées simultanément
const PAGE_DURATION = 15000 // rotation des pages si plus de 8

// Couleur de pastille selon le statut Notion/Airtable
const COULEUR_STATUT = {
  'GO': 'bg-green-500/15 text-green-300 border-green-400/50',
  'Gagné': 'bg-green-500/15 text-green-300 border-green-400/50',
  'En réponse': 'bg-blue-400/15 text-blue-200 border-blue-300/50',
  'Déposé': 'bg-blue-400/15 text-blue-200 border-blue-300/50',
  'Transmis au Club': 'bg-purple-400/15 text-purple-200 border-purple-300/50',
}
const STATUT_DEFAUT = 'bg-gold/15 text-gold border-gold/45'

const clamp = (lines) => ({
  display: '-webkit-box',
  WebkitLineClamp: lines,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
})

const fmtEuro = (n) => (typeof n === 'number' ? `${n.toLocaleString('fr-FR')} €` : '—')
const fmtDate = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function ScreenTV() {
  const [opportunities, setOpportunities] = useState([])
  const [page, setPage] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Plein écran (masque la barre d'URL du navigateur de la TV)
  const enterFullscreen = () => {
    const el = document.documentElement
    const request =
      el.requestFullscreen || el.webkitRequestFullscreen ||
      el.mozRequestFullScreen || el.msRequestFullscreen
    if (request) {
      const result = request.call(el)
      if (result && typeof result.catch === 'function') {
        result.catch((err) => console.error('Plein écran refusé :', err))
      }
    }
  }

  useEffect(() => {
    const onChange = () =>
      setIsFullscreen(Boolean(document.fullscreenElement || document.webkitFullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    document.addEventListener('webkitfullscreenchange', onChange)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      document.removeEventListener('webkitfullscreenchange', onChange)
    }
  }, [])

  // Charger les opportunités depuis l'API (Airtable, filtrées côté serveur)
  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const res = await fetch(`${API_URL}/api/opportunities`)
        const data = await res.json()
        const list = (data.data && data.data.length > 0) ? data.data : mockData.opportunities
        setOpportunities(list)
      } catch (err) {
        console.error('❌ Erreur chargement opportunités:', err)
        setOpportunities(mockData.opportunities)
      }
    }
    fetchOpportunities()
    const interval = setInterval(fetchOpportunities, 60000)
    return () => clearInterval(interval)
  }, [])

  // Pagination si plus de 8 opportunités
  const nbPages = Math.max(1, Math.ceil(opportunities.length / PER_PAGE))
  useEffect(() => {
    setPage(0)
    if (nbPages <= 1) return
    const t = setInterval(() => setPage((p) => (p + 1) % nbPages), PAGE_DURATION)
    return () => clearInterval(t)
  }, [nbPages])

  const visibles = opportunities.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE)

  // Indicateurs calculés (colonne de droite)
  const avecBudget = opportunities.filter((o) => typeof o.budget === 'number')
  const totalBudget = avecBudget.reduce((s, o) => s + o.budget, 0)
  const clients = new Set(opportunities.map((o) => o.client).filter(Boolean)).size
  const aujourdhui = new Date().setHours(0, 0, 0, 0)
  const prochaine = opportunities
    .map((o) => o.deadline).filter(Boolean).map((d) => new Date(d))
    .filter((d) => !Number.isNaN(d.getTime()) && d.getTime() >= aujourdhui)
    .sort((a, b) => a - b)[0]

  const kpis = [
    { label: 'Opportunités actives', value: opportunities.length, accent: '#efad29' },
    { label: 'Clients / structures', value: clients || '—', accent: '#6b7a2f' },
    {
      label: 'Portefeuille total',
      value: avecBudget.length ? fmtEuro(totalBudget) : '—',
      note: avecBudget.length ? `sur ${avecBudget.length} chiffrée${avecBudget.length > 1 ? 's' : ''}` : 'budgets non renseignés',
      accent: '#b5432a',
    },
    {
      label: 'Prochaine échéance',
      value: prochaine ? prochaine.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—',
      accent: '#0e424b',
    },
  ]

  return (
    <div className="w-screen h-screen bg-petrol overflow-hidden relative">
      {/* Fond dégradé pétrole */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(120% 130% at 78% 0%, #083840 0%, #00252b 58%)' }}
      />

      <div className="relative w-full h-full flex">
        {/* ============ ZONE PRINCIPALE — OPPORTUNITÉS ============ */}
        <main className="flex-1 min-w-0 flex flex-col px-[3%] py-[3%]">
          {/* Marque */}
          <div className="flex items-center gap-4 mb-[2.4%] shrink-0">
            <img
              src="/le10-logo.png"
              alt="LE 10 Coworking"
              className="w-14 h-14 object-contain"
              style={{ filter: 'drop-shadow(0 0 1px rgba(250,246,236,.85)) drop-shadow(0 0 10px rgba(250,246,236,.2))' }}
            />
            <div className="leading-none">
              <h1 className="font-serif text-xl font-semibold text-cream tracking-wide">LE 10</h1>
              <p className="text-2xs text-cream/70 mt-1 tracking-[0.34em] uppercase">Coworking</p>
            </div>
          </div>

          {/* En-tête opportunités */}
          <div className="shrink-0">
            <div className="flex items-center gap-3">
              <span className="h-px w-12 bg-gold/60" />
              <p className="text-gold text-sm font-medium tracking-[0.3em] uppercase">Appels d'offres en cours</p>
            </div>
            <div className="flex items-baseline gap-4 mt-2 mb-[2.4%]">
              <h2 className="font-serif text-5xl font-semibold text-cream leading-none">Opportunités</h2>
              <span className="font-serif text-3xl font-semibold text-gold tabular-nums">{opportunities.length}</span>
            </div>
          </div>

          {/* Grille 4 × 2 */}
          {opportunities.length > 0 ? (
            <div className="flex-1 min-h-0 grid grid-cols-4 grid-rows-2 gap-[1.6%]">
              {visibles.map((opp) => (
                <article
                  key={opp.id}
                  className="bg-petrol-light rounded-xl border-l-[3px] border-gold p-[4%] flex flex-col overflow-hidden shadow-lg shadow-black/20"
                >
                  <div className="flex items-start justify-between mb-3 shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-2xs font-bold uppercase tracking-wider border ${COULEUR_STATUT[opp.status] || STATUT_DEFAUT}`}>
                      {opp.status || 'À analyser'}
                    </span>
                    {typeof opp.score === 'number' && (
                      <span className="text-right leading-none">
                        <b className="block font-serif text-2xl text-gold font-semibold">{opp.score}</b>
                        <i className="text-[8px] not-italic uppercase tracking-wider text-cream/50">score</i>
                      </span>
                    )}
                  </div>

                  <h3 className="font-serif text-lg font-semibold text-cream leading-tight mb-1.5" style={clamp(2)}>
                    {opp.name}
                  </h3>
                  <p className="text-sm text-cream/70" style={clamp(1)}>{opp.client}</p>

                  <div className="mt-auto flex gap-6 pt-3 border-t border-cream/10 shrink-0">
                    <div>
                      <p className="text-[8px] uppercase tracking-wider text-cream/50">Budget</p>
                      <p className="text-sm font-semibold text-gold tabular-nums">{fmtEuro(opp.budget)}</p>
                    </div>
                    <div>
                      <p className="text-[8px] uppercase tracking-wider text-cream/50">Échéance</p>
                      <p className="text-sm font-semibold text-cream tabular-nums">{fmtDate(opp.deadline)}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-cream/50 text-2xl">Aucune opportunité à afficher</p>
            </div>
          )}

          {/* Pagination */}
          {nbPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-[1.6%] shrink-0">
              {Array.from({ length: nbPages }).map((_, i) => (
                <span key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === page ? 'w-8 bg-gold' : 'w-3 bg-cream/20'}`} />
              ))}
            </div>
          )}
        </main>

        {/* ============ COLONNE FIXE — INDICATEURS + LÉA ============ */}
        <aside
          className="flex-none w-[26%] flex flex-col px-[1.8%] py-[2.4%] border-l border-cream/10"
          style={{ background: 'rgba(4,26,30,.55)' }}
        >
          {/* Horloge */}
          <div className="text-right shrink-0 mb-[7%]">
            <div
              id="clock"
              className="text-5xl font-bold text-cream tabular-nums tracking-tight leading-none"
              style={{ textShadow: '0 2px 16px rgba(0,0,0,.5)' }}
            >
              --:--
            </div>
            <p className="text-2xs text-gold/90 mt-2 tracking-[0.26em] uppercase font-semibold">Agen · en direct</p>
          </div>

          {/* Indicateurs */}
          <p className="text-2xs tracking-[0.28em] uppercase text-cream/50 pt-[6%] border-t border-cream/10 mb-[5%] shrink-0">
            Indicateurs
          </p>
          <div className="flex-1 flex flex-col gap-[5%] min-h-0">
            {kpis.map((k, i) => (
              <div
                key={i}
                className="bg-petrol-lighter rounded-xl px-[8%] py-[6%] border-t-[3px] flex flex-col justify-center"
                style={{ borderTopColor: k.accent }}
              >
                <p className="text-sm text-cream/70 mb-1.5">{k.label}</p>
                <p className="font-serif text-3xl font-semibold text-cream tabular-nums leading-none">{k.value}</p>
                {k.note && <p className="text-2xs text-cream/45 mt-1.5">{k.note}</p>}
              </div>
            ))}
          </div>

          {/* Léa — rejoindre le Club */}
          <div className="mt-[6%] bg-gold rounded-2xl p-[6%] flex items-center gap-[6%] shrink-0">
            <img
              src="/qr-inscription.png"
              alt="QR rejoindre le Club"
              className="w-[36%] aspect-square rounded-lg bg-white p-1.5 shrink-0"
            />
            <div className="text-petrol leading-tight">
              <p className="font-serif text-lg font-bold mb-1">Rejoindre le Club</p>
              <p className="text-xs font-medium">Scannez pour discuter avec <b>Léa</b>, notre assistante</p>
            </div>
          </div>
        </aside>
      </div>

      {/* Bouton plein écran */}
      {!isFullscreen && (
        <button
          onClick={enterFullscreen}
          className="fixed bottom-5 right-5 z-30 flex items-center gap-3 rounded-xl bg-gold px-5 py-3 text-base font-bold text-petrol shadow-lg shadow-black/40 transition-colors hover:bg-gold-soft focus:outline-none focus:ring-4 focus:ring-cream/60"
        >
          ⛶ Plein écran
        </button>
      )}
    </div>
  )
}

// Horloge en temps réel
setInterval(() => {
  const now = new Date()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const clockElement = document.getElementById('clock')
  if (clockElement) clockElement.textContent = `${hours}:${minutes}`
}, 1000)
