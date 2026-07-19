import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Shell from './layout/Shell'
import Login from './pages/Login'
import Verify from './pages/Verify'
import Dashboard from './pages/Dashboard'
import Opportunities from './pages/Opportunities'
import Dossiers from './pages/Dossiers'
import DossierDetail from './pages/DossierDetail'
import Directory from './pages/Directory'
import Profile from './pages/Profile'

// Garde d'authentification : tant que la session n'est pas résolue,
// on n'affiche ni la coquille ni la page de connexion (évite un clignotement).
function Protege() {
  const { user, chargement } = useAuth()
  if (chargement) return <p className="p-10 text-sm text-neutral-500">Chargement…</p>
  if (!user) return <Navigate to="/connexion" replace />
  return <Shell />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/connexion" element={<Login />} />
          <Route path="/verify" element={<Verify />} />
          <Route element={<Protege />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/opportunites" element={<Opportunities />} />
            <Route path="/dossiers" element={<Dossiers />} />
            <Route path="/dossiers/:id" element={<DossierDetail />} />
            <Route path="/annuaire" element={<Directory />} />
            <Route path="/profil" element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
