import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Activity, Clock, Pause, Play, Users } from 'lucide-react'

interface AgentAction {
  agent_id: string
  agent_type: string
  action: string
  symbol: string
  amount: number
  reason: string
  executed_at: string
}

interface TickData {
  time: string
  market_data: any
  agent_actions: AgentAction[]
}

export default function SimulationPage() {
  const { id } = useParams()
  const [running, setRunning] = useState(true)
  const [ticks, setTicks] = useState<TickData[]>([])
  const [currentTick, setCurrentTick] = useState(0)
  const logRef = useRef<HTMLDivElement>(null)
  
  // 模拟 WebSocket 连接
  useEffect(() => {
    // 实际项目中这里连接 WebSocket
    const mockTick = () => {
      if (!running) return
      
      const newTick: TickData = {
        time: new Date().toISOString(),
        market_data: {
          fear_greed: { value: Math.floor(Math.random() * 100), classification: 'Neutral' }
        },
        agent_actions: Math.random() > 0.5 ? [
          {
            agent_id: `agent_${Math.floor(Math.random() * 1000)}`,
            agent_type: ['retail_trader', 'institutional_trader', 'whale_trader'][Math.floor(Math.random() * 3)],
            action: Math.random() > 0.5 ? 'buy' : 'sell',
            symbol: 'BTC',
            amount: Math.floor(Math.random() * 10000),
            reason: 'Market signal triggered',
            executed_at: new Date().toISOString()
          }
        ] : []
      }
      
      setTicks(prev => [...prev, newTick])
      setCurrentTick(prev => prev + 1)
    }
    
    const interval = setInterval(mockTick, 2000)
    return () => clearInterval(interval)
  }, [running])
  
  // 自动滚动日志
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [ticks])
  
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">仿真进行中</h1>
          <p className="text-text-secondary text-sm">ID: {id}</p>
        </div>
        
        <button
          onClick={() => setRunning(!running)}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            running ? 'bg-accent-red/20 text-accent-red' : 'bg-accent-green/20 text-accent-green'
          }`}
        >
          {running ? <Pause size={18} /> : <Play size={18} />}
          {running ? '暂停' : '继续'}
        </button>
      </div>
      
      <div className="grid grid-cols-3 gap-6">
        {/* 状态卡片 */}
        <div className="bg-card-bg border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-text-secondary mb-2">
            <Clock size={16} />
            <span className="text-sm">当前周期</span>
          </div>
          <div className="text-2xl font-bold">{currentTick}</div>
        </div>
        
        <div className="bg-card-bg border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-text-secondary mb-2">
            <Users size={16} />
            <span className="text-sm">智能体动作</span>
          </div>
          <div className="text-2xl font-bold">
            {ticks.reduce((acc, t) => acc + t.agent_actions.length, 0)}
          </div>
        </div>
        
        <div className="bg-card-bg border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-text-secondary mb-2">
            <Activity size={16} />
            <span className="text-sm">市场情绪</span>
          </div>
          <div className="text-2xl font-bold">
            {ticks.length > 0 ? ticks[ticks.length - 1].market_data?.fear_greed?.value : '--'}
          </div>
        </div>
      </div>
      
      {/* 实时日志 */}
      <div className="mt-6 bg-card-bg border border-border rounded-xl">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold">实时事件日志</h2>
        </div>
        <div ref={logRef} className="h-96 overflow-y-auto p-4 font-mono text-sm">
          {ticks.map((tick, i) => (
            <div key={i} className="mb-3">
              <div className="text-text-secondary text-xs">
                {new Date(tick.time).toLocaleTimeString()}
              </div>
              {tick.agent_actions.map((action, j) => (
                <div key={j} className={`ml-4 ${
                  action.action === 'buy' ? 'text-accent-green' : 'text-accent-red'
                }`}>
                  [{action.agent_type}] {action.agent_id.slice(0, 8)}... 
                  {action.action.toUpperCase()} {action.symbol} ${action.amount.toLocaleString()}
                  <span className="text-text-secondary ml-2">- {action.reason}</span>
                </div>
              ))}
              {tick.agent_actions.length === 0 && (
                <div className="ml-4 text-text-secondary">无交易动作</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
