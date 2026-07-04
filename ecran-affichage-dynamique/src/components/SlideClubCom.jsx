export default function SlideClubCom({ data }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-16 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Logo prominent */}
      <div className="mb-12 text-center">
        <h2 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-4">
          🌟 CLUB COM' LE 10
        </h2>
        <p className="text-2xl text-slate-300">
          Une communauté de professionnels aux compétences complémentaires
        </p>
      </div>

      {/* Carte principale */}
      <div className="max-w-4xl w-full bg-gradient-to-br from-slate-700 to-slate-800 rounded-3xl p-12 border-3 border-cyan-400 shadow-2xl shadow-cyan-400/30 mb-8">
        {/* Grille de bénéfices */}
        <div className="grid grid-cols-3 gap-8 mb-12">
          <div className="text-center">
            <p className="text-5xl mb-4">👥</p>
            <p className="text-2xl font-bold text-white mb-2">{data.clubComInfo.members}</p>
            <p className="text-slate-300">dans notre réseau</p>
          </div>

          <div className="text-center border-l border-r border-slate-600 px-8">
            <p className="text-5xl mb-4">🎨</p>
            <p className="text-2xl font-bold text-white mb-2">{data.clubComInfo.focus}</p>
            <p className="text-slate-300">pour chaque projet</p>
          </div>

          <div className="text-center">
            <p className="text-5xl mb-4">💼</p>
            <p className="text-2xl font-bold text-white mb-2">{data.clubComInfo.benefits}</p>
            <p className="text-slate-300">toute l'année</p>
          </div>
        </div>

        {/* Compétences */}
        <div className="mb-12 pb-12 border-b border-slate-600">
          <h3 className="text-2xl font-bold text-white mb-6">Domaines d'expertise</h3>
          <div className="grid grid-cols-4 gap-4">
            {['Conseil en stratégie', 'Design graphique', 'Développement web', 'Production vidéo', 'Marketing digital', 'Événementiel', 'Rédaction', 'Photographie'].map((skill, idx) => (
              <div key={idx} className="bg-slate-600 rounded-lg p-4 text-center hover:bg-blue-500 transition-colors duration-200">
                <p className="text-white font-semibold text-sm">{skill}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-2xl text-white font-bold mb-4">
            📧 Vous êtes intéressé ?
          </p>
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-6 inline-block">
            <p className="text-white text-3xl font-black tracking-wider">
              {data.clubComInfo.contact}
            </p>
          </div>
        </div>
      </div>

      {/* Témoignages/Info */}
      <div className="max-w-4xl w-full bg-slate-700/50 rounded-2xl p-8 border border-slate-600 text-center">
        <p className="text-xl text-slate-300 italic">
          "Une approche collaborative où chacun apporte son expertise pour créer des solutions innovantes et adaptées à vos besoins."
        </p>
        <p className="text-slate-400 mt-4 text-sm">— Équipe Macao</p>
      </div>
    </div>
  )
}
