import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// `role` est facultatif : sans lui, l'entrée reste visible pour tous les rôles.
// Le CRM renvoie 403 aux non-Macao — un lien qui mène à une erreur est un défaut
// d'interface, on le masque donc plutôt que de laisser l'utilisateur s'y heurter.
const LIENS = [
  { to: '/', libelle: 'Tableau de bord', end: true },
  { to: '/opportunites', libelle: 'Opportunités' },
  { to: '/dossiers', libelle: 'Dossiers' },
  { to: '/organisations', libelle: 'Organisations', role: 'Macao' },
  { to: '/annuaire', libelle: 'Annuaire' },
  { to: '/profil', libelle: 'Mon profil' }
]

const classeLien = ({ isActive }) =>
  [
    'block border-l-4 px-5 py-3 text-sm transition',
    isActive
      ? 'border-macao-terra bg-macao-ink2 font-bold text-white'
      : 'border-transparent text-white/70 hover:bg-macao-ink2 hover:text-white'
  ].join(' ')

// Coquille applicative : navigation latérale fixe + zone de contenu défilable.
export default function Shell() {
  const { user, deconnexion } = useAuth()

  return (
    <div className="flex h-full">
      <nav className="flex w-60 shrink-0 flex-col bg-macao-ink text-white">
        <div className="px-5 py-6">
          <div className="font-serif text-2xl">Macao</div>
          <div className="mt-1 text-2xs uppercase tracking-[0.28em] text-white/50">Intranet</div>
        </div>

        <div className="flex-1 py-2">
          {LIENS.filter((lien) => !lien.role || lien.role === user?.role).map((lien) => (
            <NavLink key={lien.to} to={lien.to} end={lien.end} className={classeLien}>
              {lien.libelle}
            </NavLink>
          ))}
        </div>

        <div className="border-t border-white/10 px-5 py-5">
          <div className="truncate text-xs text-white/70" title={user?.email}>{user?.email}</div>
          <div className="mt-1 text-2xs uppercase tracking-[0.2em] text-macao-gold">{user?.role}</div>
          <button
            onClick={deconnexion}
            className="mt-4 w-full rounded-md border border-white/20 px-3 py-2 text-xs text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            Se déconnecter
          </button>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
