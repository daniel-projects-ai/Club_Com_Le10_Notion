import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

// Consomme le jeton du lien magique et ouvre la session.
export default function Verify() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [erreur, setErreur] = useState(null)

  useEffect(() => {
    const token = params.get('token')
    if (!token) {
      setErreur('Aucun jeton de connexion dans le lien.')
      return
    }
    api.verifier(token)
      .then(({ user }) => {
        setUser(user)
        navigate('/', { replace: true })
      })
      .catch((e) => setErreur(
        e.message === 'NON_AUTHENTIFIE'
          ? 'Ce lien est expiré ou a déjà été utilisé.'
          : e.message
      ))
  }, [params, navigate, setUser])

  return (
    <div className="min-h-full bg-macao-ink flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        {erreur ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-xl">
            <h1 className="font-serif text-2xl text-macao-ink">Connexion impossible</h1>
            <p className="mt-3 text-sm text-neutral-600">{erreur}</p>
            <Link
              to="/connexion"
              className="mt-6 inline-block rounded-lg bg-macao-terra px-5 py-3 text-sm font-semibold text-white transition hover:bg-macao-terra/90"
            >
              Demander un nouveau lien
            </Link>
          </div>
        ) : (
          <p className="text-center text-sm uppercase tracking-[0.28em] text-macao-gold">
            Connexion en cours…
          </p>
        )}
      </div>
    </div>
  )
}
