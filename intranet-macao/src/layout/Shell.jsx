import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Quatre destinations, ordonnées par fréquence d'usage : ce qu'on regarde
// chaque matin, puis le travail en cours, puis les référentiels.
// Les routes ne changent pas — seuls les libellés parlent enfin le langage
// de l'agence plutôt que celui des marchés publics.
//
// `role` est facultatif : sans lui, l'entrée reste visible pour tous les rôles.
// Le CRM renvoie 403 aux non-Macao — un lien qui mène à une erreur est un défaut
// d'interface, on le masque donc plutôt que de laisser l'utilisateur s'y heurter.
//
// `/dossiers` n'est plus une destination de premier niveau : un devis se
// rejoint depuis le projet qui le porte ou depuis « Aujourd'hui ». La route
// reste active, seule l'entrée de menu disparaît.
const LIENS = [
  { to: '/', libelle: "Aujourd'hui", end: true },
  { to: '/opportunites', libelle: 'Projets' },
  { to: '/organisations', libelle: 'Clients & prospects', role: 'Macao' },
  { to: '/annuaire', libelle: 'Communauté' }
]

// min-h-[44px] : cible tactile confortable au doigt, sur mobile comme au bureau.
const classeLien = ({ isActive }) =>
  [
    'flex min-h-[44px] items-center border-l-4 px-5 py-3 text-sm transition',
    isActive
      ? 'border-macao-terra bg-macao-ink2 font-bold text-white'
      : 'border-transparent text-white/70 hover:bg-macao-ink2 hover:text-white'
  ].join(' ')

// Coquille applicative.
// À partir de `lg` : barre latérale fixe en permanence, contenu défilable à côté.
// En dessous : la barre devient un tiroir superposé, ouvert par l'en-tête fixe.
export default function Shell() {
  const { user, deconnexion } = useAuth()
  const [ouvert, setOuvert] = useState(false)
  const fermer = () => setOuvert(false)

  return (
    <div className="h-full lg:flex">
      {/* En-tête mobile : toujours visible, il porte le seul point d'entrée du menu. */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 bg-macao-ink px-3 text-white lg:hidden">
        <button
          type="button"
          onClick={() => setOuvert(true)}
          aria-label="Ouvrir le menu"
          aria-expanded={ouvert}
          className="flex h-11 w-11 items-center justify-center rounded-md text-xl leading-none transition hover:bg-white/10"
        >
          ☰
        </button>
        <span className="font-serif text-xl">Macao</span>
      </header>

      {/* Voile : referme le tiroir au moindre appui à côté. */}
      {ouvert && (
        <div
          onClick={fermer}
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-macao-ink/60 lg:hidden"
        />
      )}

      <nav
        className={[
          'fixed inset-y-0 left-0 z-50 flex w-60 shrink-0 flex-col bg-macao-ink text-white transition-transform duration-200',
          'lg:static lg:z-auto lg:translate-x-0',
          // `invisible` une fois fermé : sans lui, le tiroir hors écran reste
          // dans l'ordre de tabulation et piège le clavier sur mobile.
          ouvert ? 'translate-x-0' : '-translate-x-full invisible lg:visible'
        ].join(' ')}
      >
        <div className="flex items-start justify-between px-5 py-6">
          <div>
            <div className="font-serif text-2xl">Macao</div>
            <div className="mt-1 text-2xs uppercase tracking-[0.28em] text-white/50">Intranet</div>
          </div>
          <button
            type="button"
            onClick={fermer}
            aria-label="Fermer le menu"
            className="-mr-2 flex h-11 w-11 items-center justify-center rounded-md text-lg leading-none text-white/70 transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 py-2">
          {LIENS.filter((lien) => !lien.role || lien.role === user?.role).map((lien) => (
            // Sans cette fermeture, le tiroir masquerait la page qu'on vient d'ouvrir.
            <NavLink
              key={lien.to}
              to={lien.to}
              end={lien.end}
              onClick={fermer}
              className={classeLien}
            >
              {lien.libelle}
            </NavLink>
          ))}
        </div>

        <div className="border-t border-white/10 px-5 py-5">
          {/* Le profil n'est pas une destination de travail : lien discret, hors menu. */}
          <NavLink
            to="/profil"
            onClick={fermer}
            className={({ isActive }) =>
              [
                'flex min-h-[44px] items-center text-xs transition',
                isActive ? 'text-white' : 'text-white/60 hover:text-white'
              ].join(' ')
            }
          >
            Mon profil
          </NavLink>
          <div className="truncate text-xs text-white/70" title={user?.email}>{user?.email}</div>
          <div className="mt-1 text-2xs uppercase tracking-[0.2em] text-macao-gold">{user?.role}</div>
          <button
            onClick={deconnexion}
            className="mt-4 min-h-[44px] w-full rounded-md border border-white/20 px-3 py-2 text-xs text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            Se déconnecter
          </button>
        </div>
      </nav>

      {/* pt-14 : dégage la hauteur de l'en-tête fixe, qui n'existe plus à partir de lg. */}
      <main className="h-full flex-1 overflow-y-auto pt-14 lg:pt-0">
        <Outlet />
      </main>
    </div>
  )
}
