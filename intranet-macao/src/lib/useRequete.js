import { useEffect, useState } from 'react'

// Petit hook partagé : exécute un appel API une fois et expose
// les états de chargement, d'erreur et de données.
export function useRequete(appel) {
  const [donnees, setDonnees] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)

  useEffect(() => {
    let annule = false
    appel()
      .then(({ data }) => { if (!annule) setDonnees(data) })
      .catch((e) => { if (!annule) setErreur(e.message) })
      .finally(() => { if (!annule) setChargement(false) })
    return () => { annule = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { donnees, chargement, erreur }
}
