export default function SlideClubCom({ data }) {
  const skills = [
    'Conseil en stratégie', 'Design graphique', 'Développement web', 'Production vidéo',
    'Marketing digital', 'Événementiel', 'Rédaction', 'Photographie'
  ]

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-16 py-16">
      {/* En-tête avec logo */}
      <div className="mb-10 text-center flex flex-col items-center">
        <img
          src="/le10-logo.png"
          alt="LE 10 Coworking"
          className="w-28 h-28 object-contain mb-5"
          style={{ filter: 'drop-shadow(0 0 2px rgba(250,246,236,.85)) drop-shadow(0 0 18px rgba(250,246,236,.2))' }}
        />
        <div className="flex items-center justify-center gap-4 mb-3">
          <span className="h-px w-16 bg-gold/60" />
          <p className="text-gold text-lg font-medium tracking-[0.32em] uppercase">La communauté</p>
          <span className="h-px w-16 bg-gold/60" />
        </div>
        <h2 className="font-serif text-6xl font-semibold text-cream">Club Com' Le 10</h2>
        <p className="text-xl text-cream/70 mt-3">
          Des professionnels de la communication aux compétences complémentaires
        </p>
      </div>

      {/* Carte principale */}
      <div className="max-w-5xl w-full bg-petrol-light rounded-3xl p-12 border border-cream/10 shadow-2xl shadow-black/30 mb-8">
        {/* Bénéfices */}
        <div className="grid grid-cols-3 gap-8 mb-10">
          <div className="text-center">
            <p className="font-serif text-4xl font-semibold text-gold mb-2">{data.clubComInfo.members}</p>
            <p className="text-cream/70">dans notre réseau</p>
          </div>
          <div className="text-center border-l border-r border-cream/10 px-8">
            <p className="font-serif text-4xl font-semibold text-gold mb-2">{data.clubComInfo.focus}</p>
            <p className="text-cream/70">pour chaque projet</p>
          </div>
          <div className="text-center">
            <p className="font-serif text-4xl font-semibold text-gold mb-2">{data.clubComInfo.benefits}</p>
            <p className="text-cream/70">toute l'année</p>
          </div>
        </div>

        {/* Compétences */}
        <div className="mb-10 pb-10 border-b border-cream/10">
          <h3 className="font-serif text-2xl font-semibold text-cream mb-6 text-center">Domaines d'expertise</h3>
          <div className="grid grid-cols-4 gap-4">
            {skills.map((skill, idx) => (
              <div
                key={idx}
                className="bg-petrol-lighter rounded-xl p-4 text-center border border-transparent hover:border-gold/50 transition-colors duration-300"
              >
                <p className="text-cream font-medium text-sm">{skill}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="text-center">
          <p className="text-xl text-cream/80 mb-4">Vous êtes intéressé ?</p>
          <div className="bg-gold rounded-2xl px-8 py-5 inline-block">
            <p className="text-petrol text-3xl font-bold tracking-wide">
              {data.clubComInfo.contact}
            </p>
          </div>
        </div>
      </div>

      {/* Signature */}
      <div className="max-w-5xl w-full text-center">
        <p className="font-serif text-xl text-cream/70 italic">
          « Un lieu où les idées circulent, au cœur d'Agen. »
        </p>
      </div>
    </div>
  )
}
