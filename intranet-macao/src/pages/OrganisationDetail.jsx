import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../lib/api'
import { formaterDate, ouTiret } from '../lib/format'
import FormulaireEchange from '../components/FormulaireEchange'
import JournalEchange from '../components/JournalEchange'
import BarreActions from '../components/BarreActions'
import SectionRepliable from '../components/SectionRepliable'

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
  const [formulaireOuvert, setFormulaireOuvert] = useState(false)
  const [avertissements, setAvertissements] = useState([])

  // Déclaré avant l'effet de chargement pour que le montage soit enregistré
  // avant qu'une requête ne puisse aboutir.
  const monte = useRef(true)
  useEffect(() => {
    monte.current = true
    return () => { monte.current = false }
  }, [])

  // Jeton de course : un rechargement lancé après un enregistrement peut
  // revenir alors que l'utilisateur a déjà ouvert une autre fiche. Seule la
  // dernière requête émise a le droit d'écrire dans l'état.
  const derniereRequete = useRef(0)

  // `discret` : rechargement après enregistrement, sans repasser la page
  // entière en « Chargement… » alors qu'elle est déjà affichée.
  const charger = useCallback((discret = false) => {
    const jeton = ++derniereRequete.current
    const valide = () => monte.current && jeton === derniereRequete.current
    if (!discret) {
      setChargement(true)
      setErreurChargement(null)
    }
    return api.organisation(id)
      .then(({ data }) => { if (valide()) { setO(data); setErreurChargement(null) } })
      .catch((e) => {
        if (!valide()) return
        // On conserve le message du serveur : un refus d'accès (403) et une
        // fiche inexistante (404) doivent rester distinguables à l'écran.
        setErreurChargement(e.message)
        // Un rechargement discret qui échoue ne doit pas effacer une fiche déjà
        // à l'écran : l'échange vient d'être enregistré, la remplacer par une
        // page d'erreur laisserait croire que l'enregistrement a échoué.
        if (!discret) setO(null)
      })
      .finally(() => { if (valide()) setChargement(false) })
  }, [id])

  useEffect(() => {
    // Changer de fiche remet à zéro ce qui appartenait à la précédente.
    setFormulaireOuvert(false)
    setAvertissements([])
    charger()
  }, [charger])

  function echangeEnregistre(resultat) {
    // Le formulaire va être démonté : les avertissements qu'il affichait
    // disparaîtraient avec lui, on les remonte donc dans l'état de la page.
    // Affectation systématique : ceux de l'enregistrement précédent ne doivent
    // pas survivre au suivant.
    setAvertissements(Array.isArray(resultat?.avertissements) ? resultat.avertissements : [])
    setFormulaireOuvert(false)
    charger(true)
  }

  if (chargement) return <div className="p-10 text-macao-ink/60">Chargement…</div>
  if (!o) {
    return (
      <div className="p-10">
        <Link to="/organisations" className="text-sm text-macao-teal mb-4 inline-block">
          ← Tous les clients & prospects
        </Link>
        <p className="text-macao-terra">
          {erreurChargement
            ? `Impossible d’afficher cette fiche : ${erreurChargement}`
            : 'Fiche indisponible.'}
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
  const interactions = Array.isArray(o.interactions) ? o.interactions : []

  return (
    <div className="p-5 sm:p-10 max-w-5xl">
      <Link to="/organisations" className="text-sm text-macao-teal mb-4 inline-block">
        ← Tous les clients & prospects
      </Link>

      {/* La seule action de la fiche monte dans la barre : la chercher au milieu
          d'un empilement de sections était le principal reproche du client. */}
      <BarreActions
        titre={o.nom}
        sousTitre={`${ouTiret(o.type)} · ${ouTiret(o.commune)} · ${ouTiret(o.niveauRelation)}`}
      >
        {!formulaireOuvert && (
          <button
            type="button"
            onClick={() => { setAvertissements([]); setFormulaireOuvert(true) }}
            className="min-h-[44px] px-4 py-2 rounded-lg bg-macao-terra text-white text-sm font-semibold"
          >
            Noter un échange
          </button>
        )}
      </BarreActions>

      {/* Le formulaire et les retours de l'enregistrement vivent au niveau de la
          page, à côté du bouton qui les déclenche : logés dans le journal, ils
          disparaîtraient avec lui dès qu'on replie la section. */}
      {formulaireOuvert && (
        <div className="mb-6">
          <FormulaireEchange
            organisation={o}
            onEnregistre={echangeEnregistre}
            onAnnuler={() => setFormulaireOuvert(false)}
          />
        </div>
      )}

      {/* Ce ne sont pas des erreurs : l'échange est bien enregistré, mais le
          serveur signale ce qu'il n'a pas pu faire (relance sans date, auteur
          non résolu). D'où le ton ambre et la fermeture à la main. */}
      {avertissements.length > 0 && (
        <div className="mb-6 rounded-lg border border-macao-gold bg-macao-gold/15 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <ul className="text-sm text-macao-ink space-y-1">
              {avertissements.map((a) => <li key={a}>{a}</li>)}
            </ul>
            <button
              type="button"
              onClick={() => setAvertissements([])}
              aria-label="Masquer les avertissements"
              className="text-macao-ink/60 text-sm shrink-0"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Fiche à l'écran malgré une erreur : c'est un rechargement discret qui
          a échoué, le journal affiché peut donc être en retard d'un échange. */}
      {erreurChargement && (
        <p className="mb-6 rounded-lg border border-macao-terra bg-macao-terra/10 px-4 py-3 text-sm text-macao-terra">
          Le journal n’a pas pu être rafraîchi ({erreurChargement}). Rechargez la page pour voir
          l’échange qui vient d’être enregistré.
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Compteur titre="Projets" valeur={historique.nbOpportunites} couleur="#206b73" />
        <Compteur titre="Devis déposés" valeur={historique.nbDossiersDeposes} couleur="#e9a94e" />
        <Compteur titre="Gagnés" valeur={historique.nbGagnes} couleur="#206b73" />
        <Compteur titre="Perdus" valeur={historique.nbPerdus} couleur="#c0562f" />
      </div>

      {/* Ordre et état par défaut : ce qu'on vient consulter (qui contacter, ce
          qu'on s'est dit) reste ouvert ; l'historique et les références se
          déplient à la demande, compteur en titre pour savoir sans ouvrir. */}
      <SectionRepliable titre="Interlocuteurs" ouvertParDefaut>
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
      </SectionRepliable>

      <SectionRepliable titre="Journal des échanges" ouvertParDefaut>
        <JournalEchange interactions={interactions} />
      </SectionRepliable>

      <SectionRepliable titre="Projets" compteur={opportunites.length}>
        {opportunites.length === 0 ? (
          <p className="text-sm text-macao-ink/55">Aucun projet rattaché.</p>
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
      </SectionRepliable>

      <SectionRepliable titre="Devis" compteur={dossiers.length}>
        {dossiers.length === 0 ? (
          <p className="text-sm text-macao-ink/55">Aucun devis.</p>
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
      </SectionRepliable>

      <SectionRepliable titre="Informations">
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
            ['Dernier projet', formaterDate(historique.derniereOpportunite)],
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
      </SectionRepliable>
    </div>
  )
}
