import { createContext, useContext, useEffect, useState } from 'react'
import { api, surSessionExpiree } from '../lib/api'

const AuthContext = createContext(null)

// Fournit l'utilisateur connecté à toute l'application.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [chargement, setChargement] = useState(true)

  // Au montage, on tente de restaurer la session portée par le cookie.
  useEffect(() => {
    // Toute réponse 401 (session expirée en cours de navigation) vide
    // l'utilisateur : la garde `Protege` renvoie alors vers /connexion au lieu
    // de laisser une erreur technique à l'écran.
    surSessionExpiree(() => setUser(null))

    api.moi()
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null))
      .finally(() => setChargement(false))
  }, [])

  const deconnexion = async () => {
    await api.deconnexion().catch(() => {})
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, chargement, deconnexion }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
