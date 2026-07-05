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
      <div className="w-screen h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white text-2xl">⏳ Chargement...</div>
      </div>
    )
  }

  return (
    <div className="h-screen overflow-y-auto bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">📊 MODÉRATION</h1>
            <p className="text-slate-400">Contrôlez l'Écran TV en temps réel</p>
          </div>
          <div className="text-right space-y-2">
            <p className="text-slate-300 text-sm">Dernière mise à jour:</p>
            <p className="text-blue-400 font-mono mb-4">
              {state?.lastUpdate ? new Date(state.lastUpdate).toLocaleTimeString() : '--:--'}
            </p>
            <button
              onClick={() => {
                localStorage.removeItem('dashboardAuth')
                setIsAuthenticated(false)
              }}
              className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
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
            className="rounded-2xl p-6 font-bold text-xl bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 shadow-lg shadow-blue-600/50"
          >
            🔄 RAFRAÎCHIR
          </button>

          <button
            onClick={async () => {
              await fetch(`${API_URL}/api/moderation/reset`, { method: 'POST' })
              fetchData(false)
            }}
            className="rounded-2xl p-6 font-bold text-xl bg-slate-600 hover:bg-slate-700 text-white transition-all duration-300"
          >
            ⚙️ RÉINITIALISER
          </button>
        </div>

        {/* Liste des opportunités */}
        <div className="bg-slate-700/50 rounded-2xl p-8 border border-slate-600">
          <h2 className="text-2xl font-bold text-white mb-6">📌 Opportunités</h2>

          <div className="space-y-4">
            {opportunities.map((opp, idx) => {
              const isVisible = state?.opportunities?.[opp.id]?.visible !== false
              return (
                <div
                  key={opp.id}
                  className={`flex items-center justify-between rounded-lg p-6 border transition-all duration-300 ${
                    isVisible
                      ? 'bg-slate-800 border-slate-600 hover:border-blue-400'
                      : 'bg-slate-900 border-slate-700 opacity-60'
                  }`}
                >
                  <div className="flex-1">
                    <h3 className={`text-lg font-semibold mb-2 ${isVisible ? 'text-white' : 'text-slate-400'}`}>
                      {opp.name}
                    </h3>
                    <p className="text-slate-400 text-sm">
                      {opp.client} • {opp.deadline} • {opp.budget}
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
            <div className="text-center py-8 text-slate-400">
              ℹ️ Aucune opportunité à afficher
            </div>
          )}
        </div>

        {/* Stats en direct */}
        <div className="mt-8 bg-slate-700/50 rounded-2xl p-8 border border-slate-600">
          <h2 className="text-2xl font-bold text-white mb-4">📈 État du système</h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-slate-800 rounded-lg p-4 text-center">
              <p className="text-slate-400 text-sm mb-2">État</p>
              <p className="text-2xl font-bold text-blue-400">
                {state?.paused ? '⏸️ Pause' : '▶️ Direct'}
              </p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 text-center">
              <p className="text-slate-400 text-sm mb-2">Opportunités</p>
              <p className="text-2xl font-bold text-green-400">{opportunities.length}</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 text-center">
              <p className="text-slate-400 text-sm mb-2">Affichées</p>
              <p className="text-2xl font-bold text-purple-400">
                {opportunities.filter(o => state?.opportunities?.[o.id]?.visible !== false).length}
              </p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 text-center">
              <p className="text-slate-400 text-sm mb-2">Cachées</p>
              <p className="text-2xl font-bold text-red-400">
                {opportunities.filter(o => state?.opportunities?.[o.id]?.visible === false).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
