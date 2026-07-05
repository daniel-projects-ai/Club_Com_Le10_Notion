import { useEffect, useRef } from 'react'

export default function useWebSocket(onMessage) {
  const ws = useRef(null)
  const reconnectTimeoutRef = useRef(null)

  useEffect(() => {
    // Connecter au serveur WebSocket
    const wsUrl = window.location.hostname === 'localhost'
      ? `ws://localhost:5001`
      : `wss://clubcomle10notion-production.up.railway.app`
    ws.current = new WebSocket(wsUrl)

    ws.current.onopen = () => {
      console.log('✅ WebSocket connecté')
    }

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (onMessage) {
          onMessage(data.data || data)
        }
      } catch (err) {
        console.error('❌ Erreur parsing WebSocket:', err)
      }
    }

    ws.current.onerror = (error) => {
      console.error('❌ Erreur WebSocket:', error)
    }

    ws.current.onclose = () => {
      console.log('🔌 WebSocket fermé - reconnexion dans 5s...')
      // Reconnecter sans recharger la page (éviter le flash blanc)
      reconnectTimeoutRef.current = setTimeout(() => {
        ws.current = new WebSocket(wsUrl)
      }, 5000)
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (ws.current) {
        ws.current.close()
      }
    }
  }, [onMessage])

  const sendMessage = (type, payload) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type, payload }))
    }
  }

  return { sendMessage }
}
