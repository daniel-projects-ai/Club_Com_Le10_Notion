import { useState } from 'react'
import { api } from '../lib/api'

// Demande d'un lien magique. La réponse du serveur est volontairement neutre :
// on n'indique jamais si l'adresse correspond à un compte existant.
export default function Login() {
  const [email, setEmail] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [envoye, setEnvoye] = useState(false)

  const soumettre = async (e) => {
    e.preventDefault()
    setEnvoi(true)
    // On avale les erreurs : le message affiché reste le même dans tous les cas.
    await api.demanderLien(email).catch(() => {})
    setEnvoi(false)
    setEnvoye(true)
  }

  return (
    <div className="min-h-full bg-macao-ink flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <header className="text-center mb-10">
          <h1 className="font-serif text-4xl text-white">Intranet Macao</h1>
          <p className="mt-3 text-2xs uppercase tracking-[0.28em] text-macao-gold">
            l'agence créative haute en couleur
          </p>
        </header>

        {envoye ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-xl">
            <div className="text-4xl" aria-hidden="true">📬</div>
            <h2 className="mt-4 font-serif text-2xl text-macao-ink">Vérifiez vos emails</h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">
              Si ce compte existe, un lien de connexion valable 15 minutes vient d'être envoyé à{' '}
              <span className="font-medium text-macao-ink">{email}</span>.
            </p>
          </div>
        ) : (
          <form onSubmit={soumettre} className="bg-white rounded-2xl p-8 shadow-xl">
            <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-widest text-neutral-500">
              Adresse email
            </label>
            <input
              id="email"
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="prenom.nom@exemple.fr"
              className="mt-2 w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm text-macao-ink outline-none focus:border-macao-terra focus:ring-2 focus:ring-macao-terra/20"
            />
            <button
              type="submit"
              disabled={envoi}
              className="mt-5 w-full rounded-lg bg-macao-terra px-4 py-3 text-sm font-semibold text-white transition hover:bg-macao-terra/90 disabled:opacity-60"
            >
              {envoi ? 'Envoi…' : 'Recevoir mon lien de connexion'}
            </button>
            <p className="mt-4 text-center text-xs text-neutral-500">
              Pas de mot de passe : vous recevez un lien à usage unique.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
