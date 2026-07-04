import { useState, useEffect, useRef } from 'react'
import { mockData } from '../mockData'
import SlideOpportunities from './SlideOpportunities'
import SlideStats from './SlideStats'
import SlideClubCom from './SlideClubCom'

export default function ScreenTV() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [fadeOut, setFadeOut] = useState(false)
  const [moderationState, setModerationState] = useState(null)
  const wsRef = useRef(null)

  const slides = [
    { id: 1, component: SlideOpportunities, duration: 20 },
    { id: 2, component: SlideStats, duration: 15 },
    { id: 3, component: SlideClubCom, duration: 20 }
  ]

  // Connecter au WebSocket pour recevoir les mises à jour de modération
  useEffect(() => {
    const wsUrl = `ws://${window.location.hostname}:5001`
    wsRef.current = new WebSocket(wsUrl)

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.data) {
          setModerationState(data.data)
          console.log('📡 État modération reçu:', data.data)
        }
      } catch (err) {
        console.error('❌ Erreur WebSocket:', err)
      }
    }

    wsRef.current.onerror = (error) => {
      console.error('❌ WebSocket error:', error)
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
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
  const visibleOpportunities = mockData.opportunities.filter(opp => {
    return moderationState?.opportunities?.[opp.id]?.visible !== false
  })

  const filteredData = {
    ...mockData,
    opportunities: visibleOpportunities
  }

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center overflow-hidden">
      {/* Conteneur principal - sans fade pour éviter les flashs blancs */}
      <div className="w-full h-full">
        <CurrentSlideComponent data={filteredData} />
      </div>

      {/* Indicateurs de slide */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3">
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            className={`h-3 rounded-full transition-all duration-300 ${
              idx === currentSlide
                ? 'w-8 bg-blue-400'
                : 'w-3 bg-slate-600'
            }`}
          />
        ))}
      </div>

      {/* Logo/Branding en haut à gauche */}
      <div className="fixed top-8 left-8 text-white">
        <h1 className="text-3xl font-bold tracking-wider">MACAO</h1>
        <p className="text-xs text-slate-400 mt-1">Club Com' Le 10</p>
      </div>

      {/* Horloge en haut à droite */}
      <div className="fixed top-8 right-8 text-white text-right">
        <div id="clock" className="text-2xl font-mono font-bold">--:--</div>
        <p className="text-xs text-slate-400 mt-1">Mise à jour auto</p>
      </div>
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
