import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../lib/api'
import { formaterDate, ouTiret } from '../lib/format'

// Le site web est saisi dans Airtable : ce n'est pas forcément une URL exploitable.
function SiteWeb({ url }) {
  if (!url) return <span className="text-macao-ink">—</span>
  if (!/^https?:\/\//i.test(url)) return <span className="text-macao-ink">{url}</span>
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-macao-teal underline break-all"
    >
      {url}
    </a>
  )
}

function Compteur({ titre, valeur, couleur }) {
  return (
    <div className="bg-white rounded-xl p-5 border-t-4" style={{ borderTopColor: couleur }}>
      <p className="text-sm text-macao-ink/55 mb-1">{titre}</p>
      {/* Les compteurs valent `null` et jamais 0 quand il n'y a rien à compter :
          ouTiret laisse donc passer un vrai 0 s'il arrive un jour. */}
      <p className="font-serif text-3xl text-macao-ink">{ouTiret(valeur)}</p>
    </div>
  )
}

export default function OrganisationDetail() {
  const { id } = useParams()
  const [o, setO] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreurChargement, setErreurChargement] = useState(null)

  useEffect(() => {
    let annule = false
    setChargement(true)
    setErreurChargement(null)
    api.organisation(id)
      .then(({ data }) => { if (!annule) setO(data) })
      .catch((e) => {
        // On conserve le message du serveur : un refus d'accès (403) et une
        // fiche inexistante (404) doivent rester distinguables à l'écran.
        if (!annule) { setO(null); setErreurChargement(e.message) }
      })
      .finally(() => { if (!annule) setChargement(false) })
    return () => { annule = true }
  }, [id])

  if (chargement) return <div className="p-10 text-macao-ink/60">Chargement…</div>
  if (!o) {
    return (
      <div className="p-10">
        <Link to="/organisations" className="text-sm text-macao-teal mb-4 inline-block">
          ← Toutes les organisations
        </Link>
        <p className="text-macao-terra">
          {erreurChargement
            ? `Impossible d’afficher cette organisation : ${erreurChargement}`
            : 'Organisation indisponible.'}
        </p>
      </div>
    )
  }

  // Ces collections peuvent manquer de la réponse : on normalise une fois pour
  // que l'affichage n'ait pas à s'en préoccuper.
  const historique = o.historique || {}
  const interlocuteurs = Array.isArray(o.interlocuteurs) ? o.interlocuteurs : []
  const opportunites = Array.isArray(o.opportunites) ? o.opportunites : []
  const dossiers = Array.isArray(o.dossiers) ? o.dossiers : []

  return (
    <div className="p-10 max-w-5xl">
      <Link to="/organisations" className="text-sm text-macao-teal mb-4 inline-block">
        ← Toutes les organisations
      </Link>

      <h1 className="font-serif text-3xl text-macao-ink mb-1">{o.nom}</h1>
      <p className="text-macao-ink/60 mb-8">
        {ouTiret(o.type)} · {ouTiret(o.commune)} · {ouTiret(o.niveauRelation)}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Compteur titre="Opportunités" valeur={historique.nbOpportunites} couleur="#206b73" />
        <Compteur titre="Dossiers déposés" valeur={historique.nbDossiersDeposes} couleur="#e9a94e" />
        <Compteur titre="Gagnés" valeur={historique.nbGagnes} couleur="#206b73" />
        <Compteur titre="Perdus" valeur={historique.nbPerdus} couleur="#c0562f" />
      </div>

      <section className="bg-white rounded-xl p-6 mb-6">
        <h2 className="font-serif text-xl text-macao-ink mb-4">Interlocuteurs</h2>
        {interlocuteurs.length === 0 ? (
          <p className="text-sm text-macao-ink/55">Aucun interlocuteur enregistré.</p>
        ) : (
          <ul className="space-y-4">
            {interlocuteurs.map((i, index) => (
              <li key={i.id || `interlocuteur-${index}`} className="border-b border-macao-ink/10 pb-4 last:border-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <span className="text-macao-ink font-medium">{ouTiret(i.nom)}</span>
                  {/* Contrainte réglementaire : une opposition au démarchage doit
                      sauter aux yeux avant tout contact, pas se deviner. */}
                  {i.opposition && (
                    <span className="text-xs px-3 py-1 rounded-full bg-macao-terra text-white">
                      Ne pas démarcher
                    </span>
                  )}
                </div>
                <p className="text-sm text-macao-ink/60">{ouTiret(i.fonction)}</p>
                <p className="text-sm text-macao-ink/60">
                  {ouTiret(i.email)} · {ouTiret(i.telephone)}
                </p>
                {i.notes && <p className="text-sm text-macao-ink/60 mt-1">{i.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-white rounded-xl p-6 mb-6">
        <h2 className="font-serif text-xl text-macao-ink mb-4">Opportunités</h2>
        {opportunites.length === 0 ? (
          <p className="text-sm text-macao-ink/55">Aucune opportunité rattachée.</p>
        ) : (
          <ul className="space-y-3">
            {opportunites.map((op, index) => (
              <li
                key={op.id || `opportunite-${index}`}
                className="flex flex-wrap gap-x-8 gap-y-1 border-b border-macao-ink/10 pb-3 last:border-0 last:pb-0"
              >
                <span className="text-macao-ink">{ouTiret(op.nom)}</span>
                <span className="text-sm">
                  <span className="text-macao-ink/50">Statut </span>
                  <b>{ouTiret(op.statut)}</b>
                </span>
                <span className="text-sm">
                  <span className="text-macao-ink/50">Échéance </span>
                  <b>{formaterDate(op.dateLimite)}</b>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-white rounded-xl p-6 mb-6">
        <h2 className="font-serif text-xl text-macao-ink mb-4">Dossiers de réponse</h2>
        {dossiers.length === 0 ? (
          <p className="text-sm text-macao-ink/55">Aucun dossier de réponse.</p>
        ) : (
          <ul className="space-y-3">
            {dossiers.map((d, index) => (
              <li
                key={d.id || `dossier-${index}`}
                className="flex flex-wrap gap-x-8 gap-y-1 border-b border-macao-ink/10 pb-3 last:border-0 last:pb-0"
              >
                <span className="text-macao-ink">{ouTiret(d.nom)}</span>
                <span className="text-sm">
                  <span className="text-macao-ink/50">Statut </span>
                  <b>{ouTiret(d.statut)}</b>
                </span>
                <span className="text-sm">
                  <span className="text-macao-ink/50">Résultat </span>
                  <b>{ouTiret(d.resultat)}</b>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-white rounded-xl p-6">
        <h2 className="font-serif text-xl text-macao-ink mb-4">Informations</h2>
        <div className="space-y-3">
          {[
            ['Nature', ouTiret(o.nature)],
            ['Code postal', ouTiret(o.codePostal)],
            ['Territoire', ouTiret(o.territoire)],
            ['SIRET', ouTiret(o.siret)],
            ['Site web', <SiteWeb url={o.siteWeb} />],
            ['Origine', ouTiret(o.origine)],
            ['Référent Macao', ouTiret(o.referent)],
            ['Dernier échange', formaterDate(o.dernierEchange)],
            ['Dernière opportunité', formaterDate(historique.derniereOpportunite)],
            ['Plateforme', ouTiret(o.plateforme)],
            ['Particularités', ouTiret(o.particularites)],
            ['Notes', ouTiret(o.notes)]
          ].map(([label, valeur]) => (
            <div key={label} className="flex border-b border-macao-ink/10 pb-3 last:border-0">
              <span className="w-44 text-macao-ink/55 text-sm shrink-0">{label}</span>
              <span className="text-macao-ink">{valeur}</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-macao-ink/50 mt-4">
          Ces informations se saisissent dans Airtable.
        </p>
      </section>
    </div>
  )
}
