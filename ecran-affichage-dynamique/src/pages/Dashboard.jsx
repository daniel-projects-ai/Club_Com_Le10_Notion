import { useState, useEffect } from 'react'
import { mockData } from '../mockData'
import Login from './Login'

const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5001'
  : 'https://clubcomle10notion-production.up.railway.app'

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('dashboardAuth') === 'true'
  )
  const [state, setState] = useState(null)
  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading] = useState(true)

  // Tous les hooks doivent être appelés avant tout return conditionnel
  useEffect(() => {
    if (!isAuthenticated) return

    fetchData(true)
    // Rafraîchir en silence toutes les 5s pour rester synchronisé
    const interval = setInterval(() => fetchData(false), 5000)
    return () => clearInterval(interval)
  }, [isAuthenticated])

  async function fetchData(isInitial = false) {
    try {
      if (isInitial) setLoading(true)
      const [oppRes, stateRes] = await Promise.all([
        fetch(`${API_URL}/api/notion/opportunities`),
        fetch(`${API_URL}/api/moderation/state`)
      ])

      if (!oppRes.ok || !stateRes.ok) {
        throw new Error('API error')
      }

      const oppData = await oppRes.json()
      const stateData = await stateRes.json()

      // Si l'API retourne une liste vide, utiliser les mockData
      const oppsToUse = (oppData.data && oppData.data.length > 0) ? oppData.data : mockData.opportunities
      setOpportunities(oppsToUse)
      setState(stateData)
    } catch (err) {
      console.error('❌ Erreur chargement:', err)
      if (isInitial) {
        setOpportunities(mockData.opportunities)
        setState({ paused: false, opportunities: {}, lastUpdate: new Date() })
      }
    } finally {
      if (isInitial) setLoading(false)
    }
  }

  const toggleOpportunity = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/moderation/toggle-opportunity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })

      if (res.ok) {
        const data = await res.json()
        setState(data.state)
      }
    } catch (err) {
      console.error('❌ Erreur toggle:', err)
    }
  }

  const togglePause = async () => {
    await fetch(`${API_URL}/api/moderation/pause`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    fetchData(false)
  }

  if (!isAuthenticated) {
    return <Login onLogin={setIsAuthenticated} />
  }

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-petrol">
        <div className="text-cream text-2xl">⏳ Chargement...</div>
      </div>
    )
  }

  return (
    <div className="h-screen overflow-y-auto bg-petrol p-8">
      <div className="max-w-7xl mx-auto pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <img
              src="/le10-logo.png"
              alt="LE 10"
              className="w-14 h-14 object-contain"
              style={{ filter: 'drop-shadow(0 0 1px rgba(250,246,236,.8)) drop-shadow(0 0 10px rgba(250,246,236,.2))' }}
            />
            <div>
              <h1 className="font-serif text-4xl font-semibold text-cream mb-1">Modération</h1>
              <p className="text-cream/60">Contrôlez l'Écran TV en temps réel</p>
            </div>
          </div>
          <div className="text-right space-y-2">
            <p className="text-cream/60 text-sm">Dernière mise à jour :</p>
            <p className="text-gold font-mono mb-4 tabular-nums">
              {state?.lastUpdate ? new Date(state.lastUpdate).toLocaleTimeString() : '--:--'}
            </p>
            <button
              onClick={() => {
                localStorage.removeItem('dashboardAuth')
                setIsAuthenticated(false)
              }}
              className="bg-petrol-light hover:bg-petrol-lighter text-cream px-4 py-2 rounded-lg text-sm transition-colors border border-cream/10"
            >
              🚪 Déconnexion
            </button>
          </div>
        </div>

        {/* Contrôles principaux */}
        <div className="grid grid-cols-3 gap-6 mb-12">
          <button
            onClick={togglePause}
            className={`rounded-2xl p-6 font-bold text-xl transition-all duration-300 ${
              state?.paused
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/50'
                : 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/50'
            }`}
          >
            {state?.paused ? '⏸️ REPRENDRE' : '▶️ EN DIRECT'}
          </button>

          <button
            onClick={() => fetchData(true)}
            className="rounded-2xl p-6 font-bold text-xl bg-gold hover:bg-gold-soft text-petrol transition-all duration-300 shadow-lg shadow-gold/30"
          >
            🔄 RAFRAÎCHIR
          </button>

          <button
            onClick={async () => {
              await fetch(`${API_URL}/api/moderation/reset`, { method: 'POST' })
              fetchData(false)
            }}
            className="rounded-2xl p-6 font-bold text-xl bg-petrol-light hover:bg-petrol-lighter text-cream border border-cream/10 transition-all duration-300"
          >
            ⚙️ RÉINITIALISER
          </button>
        </div>

        {/* Liste des opportunités */}
        <div className="bg-petrol-light rounded-2xl p-8 border border-cream/10">
          <h2 className="font-serif text-2xl font-semibold text-cream mb-6">Opportunités</h2>

          <div className="space-y-4">
            {opportunities.map((opp, idx) => {
              const isVisible = state?.opportunities?.[opp.id]?.visible !== false
              return (
                <div
                  key={opp.id}
                  className={`flex items-center justify-between rounded-lg p-6 border transition-all duration-300 ${
                    isVisible
                      ? 'bg-petrol border-cream/10 hover:border-gold/50'
                      : 'bg-petrol/40 border-cream/5 opacity-60'
                  }`}
                >
                  <div className="flex-1">
                    <h3 className={`text-lg font-semibold mb-2 ${isVisible ? 'text-cream' : 'text-cream/50'}`}>
                      {opp.name}
                    </h3>
                    <p className="text-cream/55 text-sm">
                      {[
                        opp.client,
                        opp.status,
                        typeof opp.budget === 'number'
                          ? `${opp.budget.toLocaleString('fr-FR')} €`
                          : null,
                        opp.deadline
                          ? new Date(opp.deadline).toLocaleDateString('fr-FR')
                          : null,
                      ]
                        .filter(Boolean)
                        .join(' • ')}
                    </p>
                  </div>

                  <button
                    onClick={() => toggleOpportunity(opp.id)}
                    className={`ml-6 px-6 py-3 rounded-lg font-bold transition-all duration-300 whitespace-nowrap ${
                      isVisible
                        ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/30'
                        : 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30'
                    }`}
                  >
                    {isVisible ? '✅ AFFICHER' : '🚫 MASQUÉ'}
                  </button>
                </div>
              )
            })}
          </div>

          {opportunities.length === 0 && (
            <div className="text-center py-8 text-cream/50">
              ℹ️ Aucune opportunité à afficher
            </div>
          )}
        </div>

        {/* Stats en direct */}
        <div className="mt-8 bg-petrol-light rounded-2xl p-8 border border-cream/10">
          <h2 className="font-serif text-2xl font-semibold text-cream mb-4">État du système</h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-petrol rounded-lg p-4 text-center border border-cream/5">
              <p className="text-cream/55 text-sm mb-2">État</p>
              <p className="text-2xl font-bold text-gold">
                {state?.paused ? '⏸️ Pause' : '▶️ Direct'}
              </p>
            </div>
            <div className="bg-petrol rounded-lg p-4 text-center border border-cream/5">
              <p className="text-cream/55 text-sm mb-2">Opportunités</p>
              <p className="text-2xl font-bold text-cream tabular-nums">{opportunities.length}</p>
            </div>
            <div className="bg-petrol rounded-lg p-4 text-center border border-cream/5">
              <p className="text-cream/55 text-sm mb-2">Affichées</p>
              <p className="text-2xl font-bold text-green-400 tabular-nums">
                {opportunities.filter(o => state?.opportunities?.[o.id]?.visible !== false).length}
              </p>
            </div>
            <div className="bg-petrol rounded-lg p-4 text-center border border-cream/5">
              <p className="text-cream/55 text-sm mb-2">Cachées</p>
              <p className="text-2xl font-bold text-terra tabular-nums">
                {opportunities.filter(o => state?.opportunities?.[o.id]?.visible === false).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
