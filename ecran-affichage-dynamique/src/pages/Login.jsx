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
    <div
      className="w-screen h-screen flex items-center justify-center overflow-auto"
      style={{ background: 'radial-gradient(130% 150% at 88% 0%, #083840 0%, #00252b 60%)' }}
    >
      <div className="w-full max-w-md p-6">
        {/* En-tête */}
        <div className="text-center mb-10 flex flex-col items-center">
          <img
            src="/le10-logo.png"
            alt="LE 10 Coworking"
            className="w-24 h-24 object-contain mb-5"
            style={{ filter: 'drop-shadow(0 0 2px rgba(250,246,236,.85)) drop-shadow(0 0 16px rgba(250,246,236,.2))' }}
          />
          <h1 className="font-serif text-4xl font-semibold text-cream">LE 10</h1>
          <p className="text-cream/60 tracking-[0.3em] uppercase text-sm mt-1">Modération</p>
        </div>

        {/* Formulaire */}
        <form
          onSubmit={handleLogin}
          className="bg-petrol-light rounded-2xl p-8 border border-cream/10 shadow-2xl shadow-black/30"
        >
          <div className="mb-6">
            <label className="block text-cream font-semibold mb-2">Utilisateur</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Identifiant"
              className="w-full px-4 py-3 rounded-lg bg-petrol border border-cream/15 text-cream placeholder-cream/40 focus:border-gold focus:outline-none transition-colors"
              autoFocus
            />
          </div>

          <div className="mb-6">
            <label className="block text-cream font-semibold mb-2">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              className="w-full px-4 py-3 rounded-lg bg-petrol border border-cream/15 text-cream placeholder-cream/40 focus:border-gold focus:outline-none transition-colors"
            />
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-terra/20 border border-terra text-cream text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gold hover:bg-gold-soft text-petrol font-bold py-3 rounded-lg transition-colors duration-300"
          >
            Se connecter
          </button>

          {/* Credentials pour démo */}
          <div className="mt-6 p-3 rounded-lg bg-petrol border border-cream/10 text-xs text-cream/60">
            <p className="font-semibold mb-2 text-cream/80">🔑 Identifiants démo :</p>
            <p>Utilisateur : <span className="font-mono text-gold">macao</span></p>
            <p>Mot de passe : <span className="font-mono text-gold">Le10Admin2026</span></p>
          </div>
        </form>
      </div>
    </div>
  )
}
