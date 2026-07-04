import { useState } from 'react'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = (e) => {
    e.preventDefault()

    // Credentials simples pour démo
    // En production, connecter à une vraie API d'auth
    const VALID_USERNAME = 'macao'
    const VALID_PASSWORD = 'Le10Admin2026'

    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      localStorage.setItem('dashboardAuth', 'true')
      onLogin(true)
    } else {
      setError('Identifiants incorrects')
      setPassword('')
    }
  }

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-white mb-2">MACAO</h1>
          <p className="text-slate-400">Club Com' Le 10 — Modération</p>
        </div>

        {/* Formulaire */}
        <form
          onSubmit={handleLogin}
          className="bg-slate-700/50 rounded-2xl p-8 border border-slate-600"
        >
          <div className="mb-6">
            <label className="block text-white font-semibold mb-2">Utilisateur</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Identifiant"
              className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder-slate-500 focus:border-blue-400 focus:outline-none transition-colors"
              autoFocus
            />
          </div>

          <div className="mb-6">
            <label className="block text-white font-semibold mb-2">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder-slate-500 focus:border-blue-400 focus:outline-none transition-colors"
            />
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-600/20 border border-red-600 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors duration-300"
          >
            Se connecter
          </button>

          {/* Credentials pour démo */}
          <div className="mt-6 p-3 rounded-lg bg-slate-800 border border-slate-600 text-xs text-slate-400">
            <p className="font-semibold mb-2">🔑 Identifiants démo :</p>
            <p>Utilisateur: <span className="font-mono text-slate-300">macao</span></p>
            <p>Mot de passe: <span className="font-mono text-slate-300">Le10Admin2026</span></p>
          </div>
        </form>
      </div>
    </div>
  )
}
