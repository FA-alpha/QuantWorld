import { useState, useEffect, useCallback, useRef } from 'react'

interface TickData {
  time: string
  tick_number: number
  market_data: any
  agent_actions: any[]
  memory_stats: { total_memories: number; total_connections: number }
}

interface SimulationState {
  id: string
  running: boolean
  ticks: TickData[]
  agents: any[]
  currentTick: number
  error: string | null
}

export function useSimulation(simId: string | undefined) {
  const [state, setState] = useState<SimulationState>({
    id: simId || '',
    running: false,
    ticks: [],
    agents: [],
    currentTick: 0,
    error: null
  })
  
  const wsRef = useRef<WebSocket | null>(null)
  
  const connect = useCallback(() => {
    if (!simId) return
    
    const ws = new WebSocket(`ws://localhost:8000/ws/simulation/${simId}`)
    
    ws.onopen = () => {
      console.log('WebSocket connected')
      ws.send(JSON.stringify({ action: 'subscribe' }))
    }
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      if (data.type === 'tick') {
        setState(prev => ({
          ...prev,
          ticks: [...prev.ticks.slice(-100), data.tick],
          currentTick: data.tick.tick_number,
          running: true
        }))
      } else if (data.type === 'agents') {
        setState(prev => ({ ...prev, agents: data.agents }))
      } else if (data.type === 'error') {
        setState(prev => ({ ...prev, error: data.message }))
      }
    }
    
    ws.onclose = () => {
      console.log('WebSocket disconnected')
      setState(prev => ({ ...prev, running: false }))
    }
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      setState(prev => ({ ...prev, error: 'Connection error' }))
    }
    
    wsRef.current = ws
  }, [simId])
  
  const disconnect = useCallback(() => {
    wsRef.current?.close()
    wsRef.current = null
  }, [])
  
  const start = useCallback(async () => {
    if (!simId) return
    
    try {
      const resp = await fetch(`/api/simulations/${simId}/start`, { method: 'POST' })
      if (resp.ok) {
        setState(prev => ({ ...prev, running: true }))
      }
    } catch (err) {
      console.error('Failed to start simulation:', err)
    }
  }, [simId])
  
  const stop = useCallback(async () => {
    if (!simId) return
    
    try {
      await fetch(`/api/simulations/${simId}/stop`, { method: 'POST' })
      setState(prev => ({ ...prev, running: false }))
    } catch (err) {
      console.error('Failed to stop simulation:', err)
    }
  }, [simId])
  
  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])
  
  return {
    ...state,
    start,
    stop,
    reconnect: connect
  }
}
