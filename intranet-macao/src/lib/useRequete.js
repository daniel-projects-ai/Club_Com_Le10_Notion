import { useCallback, useEffect, useRef, useState } from 'react'

// Petit hook partagé : exécute un appel API une fois et expose
// les états de chargement, d'erreur et de données.
// `recharger` rejoue l'appel et rend une promesse : l'appelant peut donc
// attendre que les données soient à jour avant de relâcher son état « en cours ».
export function useRequete(appel) {
  const [donnees, setDonnees] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)

  // Déclaré avant l'effet de chargement pour que le montage soit enregistré
  // avant qu'une requête ne puisse aboutir.
  const monte = useRef(true)
  useEffect(() => {
    monte.current = true
    return () => { monte.current = false }
  }, [])

  const recharger = useCallback(
    () => appel()
      .then(({ data }) => { if (monte.current) { setDonnees(data); setErreur(null) } })
      .catch((e) => { if (monte.current) setErreur(e.message) })
      .finally(() => { if (monte.current) setChargement(false) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  useEffect(() => { recharger() }, [recharger])

  return { donnees, chargement, erreur, recharger }
}
