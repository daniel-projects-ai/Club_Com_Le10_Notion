import { useState, useEffect, useRef } from 'react'
import { mockData } from '../mockData'
import SlideOpportunities from './SlideOpportunities'
import SlideStats from './SlideStats'
import SlideClubCom from './SlideClubCom'

export default function ScreenTV() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [fadeOut, setFadeOut] = useState(false)
  const [moderationState, setModerationState] = useState(null)
  const [opportunities, setOpportunities] = useState([])
  const [isFullscreen, setIsFullscreen] = useState(false)

  const slides = [
    { id: 1, component: SlideOpportunities, duration: 20 },
    { id: 2, component: SlideStats, duration: 15 },
    { id: 3, component: SlideClubCom, duration: 20 }
  ]

  // Plein écran (masque la barre d'URL du navigateur de la TV)
  // L'API Fullscreen exige un clic utilisateur : d'où le bouton.
  const enterFullscreen = () => {
    const el = document.documentElement
    const request =
      el.requestFullscreen ||
      el.webkitRequestFullscreen ||
      el.mozRequestFullScreen ||
      el.msRequestFullscreen
    if (request) {
      const result = request.call(el)
      if (result && typeof result.catch === 'function') {
        result.catch((err) => console.error('Plein écran refusé :', err))
      }
    }
  }

  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement || document.webkitFullscreenElement))
    }
    document.addEventListener('fullscreenchange', onChange)
    document.addEventListener('webkitfullscreenchange', onChange)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      document.removeEventListener('webkitfullscreenchange', onChange)
    }
  }, [])

  // Charger les opportunités depuis l'API
  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const API_URL = window.location.hostname === 'localhost'
          ? 'http://localhost:5001'
          : 'https://clubcomle10notion-production.up.railway.app'
        const res = await fetch(`${API_URL}/api/notion/opportunities`)
        const data = await res.json()
        setOpportunities(data.data || mockData.opportunities)
      } catch (err) {
        console.error('❌ Erreur chargement opportunités:', err)
        setOpportunities(mockData.opportunities)
      }
    }

    fetchOpportunities()
    const interval = setInterval(fetchOpportunities, 60000) // Rafraîchir toutes les 60s
    return () => clearInterval(interval)
  }, [])

  // Récupérer l'état de modération via HTTP polling
  useEffect(() => {
    const fetchModerationState = async () => {
      try {
        const API_URL = window.location.hostname === 'localhost'
          ? 'http://localhost:5001'
          : 'https://clubcomle10notion-production.up.railway.app'
        const res = await fetch(`${API_URL}/api/moderation/state`)
        const data = await res.json()
        setModerationState(data)
        console.log('📡 État modération reçu:', data)
      } catch (err) {
        console.error('❌ Erreur chargement état:', err)
      }
    }

    fetchModerationState()
    const interval = setInterval(fetchModerationState, 2000) // Vérifier toutes les 2s
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const duration = slides[currentSlide].duration * 1000

    const timer = setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, duration)

    return () => clearTimeout(timer)
  }, [currentSlide])

  const CurrentSlideComponent = slides[currentSlide].component

  // Filtrer les opportunités visibles
  const visibleOpportunities = opportunities.filter(opp => {
    return moderationState?.opportunities?.[opp.id]?.visible !== false
  })

  const filteredData = {
    ...mockData,
    opportunities: visibleOpportunities
  }

  return (
    <div className="w-screen h-screen bg-petrol flex items-center justify-center overflow-hidden relative">
      {/* Halo pétrole plus clair en haut à droite (rappel de la maquette) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(130% 150% at 88% 0%, #083840 0%, #00252b 60%)' }}
      />

      {/* Conteneur principal - sans fade pour éviter les flashs blancs */}
      <div className="w-full h-full relative">
        <CurrentSlideComponent data={filteredData} />
      </div>

      {/* Indicateurs de slide */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3 z-20">
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            className={`h-2 rounded-full transition-all duration-300 ${
              idx === currentSlide ? 'w-8 bg-gold' : 'w-2 bg-petrol-lighter'
            }`}
          />
        ))}
      </div>

      {/* Logo/Branding en haut à gauche */}
      <div className="fixed top-8 left-8 flex items-center gap-4 z-20">
        <img
          src="/le10-logo.png"
          alt="LE 10 Coworking"
          className="w-16 h-16 object-contain"
          style={{ filter: 'drop-shadow(0 0 1px rgba(250,246,236,.9)) drop-shadow(0 0 12px rgba(250,246,236,.22))' }}
        />
        <div className="leading-none">
          <h1 className="font-serif text-2xl font-semibold text-cream tracking-wide">LE 10</h1>
          <p className="text-2xs text-cream/70 mt-1 tracking-[0.34em] uppercase">Coworking</p>
        </div>
      </div>

      {/* Horloge en haut à droite */}
      <div className="fixed top-8 right-8 text-right z-20">
        <div id="clock" className="text-2xl font-semibold text-cream tabular-nums tracking-wider">--:--</div>
        <p className="text-2xs text-cream/60 mt-1 tracking-[0.2em] uppercase">Agen · en direct</p>
      </div>

      {/* Bouton plein écran - masque la barre d'URL sur la TV.
          Disparaît une fois le plein écran actif. */}
      {!isFullscreen && (
        <button
          onClick={enterFullscreen}
          className="fixed bottom-6 right-6 z-30 flex items-center gap-3 rounded-xl bg-gold px-6 py-4 text-lg font-bold text-petrol shadow-lg shadow-black/40 transition-colors hover:bg-gold-soft focus:outline-none focus:ring-4 focus:ring-cream/60"
        >
          ⛶ Plein écran
        </button>
      )}
    </div>
  )
}

// Horloge en temps réel
setInterval(() => {
  const now = new Date()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const clockElement = document.getElementById('clock')
  if (clockElement) {
    clockElement.textContent = `${hours}:${minutes}`
  }
}, 1000)
