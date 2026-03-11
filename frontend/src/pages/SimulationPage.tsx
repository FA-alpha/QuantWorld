import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Activity, Clock, Pause, Play, Users, Network } from 'lucide-react'
import AgentGraph from '../components/AgentGraph'
import MarketPanel from '../components/MarketPanel'

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
  const [showGraph, setShowGraph] = useState(true)
  const logRef = useRef<HTMLDivElement>(null)
  
  // 模拟智能体节点数据
  const [graphData, setGraphData] = useState({
    nodes: [
      { id: 'retail_1', label: 'Retail_1', group: 'retail_trader', color: '#F85149', size: 10 },
      { id: 'retail_2', label: 'Retail_2', group: 'retail_trader', color: '#F85149', size: 10 },
      { id: 'retail_3', label: 'Retail_3', group: 'retail_trader', color: '#F85149', size: 10 },
      { id: 'inst_1', label: 'Inst_1', group: 'institutional_trader', color: '#3FB950', size: 20 },
      { id: 'inst_2', label: 'Inst_2', group: 'institutional_trader', color: '#3FB950', size: 20 },
      { id: 'whale_1', label: 'Whale_1', group: 'whale_trader', color: '#58A6FF', size: 30 },
    ],
    edges: [
      { from: 'whale_1', to: 'inst_1' },
      { from: 'whale_1', to: 'inst_2' },
      { from: 'inst_1', to: 'retail_1' },
      { from: 'inst_1', to: 'retail_2' },
      { from: 'inst_2', to: 'retail_3' },
    ]
  })
  
  // 模拟 WebSocket 连接
  useEffect(() => {
    const mockTick = () => {
      if (!running) return
      
      const newTick: TickData = {
        time: new Date().toISOString(),
        market_data: {
          fear_greed: { value: Math.floor(Math.random() * 100), classification: 'Neutral' },
          liquidations: {
            total_usd: Math.random() * 500000000,
            total_long_usd: Math.random() * 300000000,
            total_short_usd: Math.random() * 200000000
          },
          etf_flows: {
            BTC: { latest_flow: (Math.random() - 0.5) * 200000000 }
          }
        },
        agent_actions: Math.random() > 0.3 ? [
          {
            agent_id: `agent_${Math.floor(Math.random() * 1000)}`,
            agent_type: ['retail_trader', 'institutional_trader', 'whale_trader'][Math.floor(Math.random() * 3)],
            action: Math.random() > 0.5 ? 'buy' : 'sell',
            symbol: ['BTC', 'ETH', 'SOL'][Math.floor(Math.random() * 3)],
            amount: Math.floor(Math.random() * 100000),
            reason: ['FOMO 买入', '恐慌卖出', '理性建仓', '风控减仓'][Math.floor(Math.random() * 4)],
            executed_at: new Date().toISOString()
          }
        ] : []
      }
      
      setTicks(prev => [...prev.slice(-50), newTick])
      setCurrentTick(prev => prev + 1)
    }
    
    const interval = setInterval(mockTick, 2000)
    return () => clearInterval(interval)
  }, [running])
  
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [ticks])
  
  const latestMarketData = ticks.length > 0 ? ticks[ticks.length - 1].market_data : undefined
  
  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">仿真进行中</h1>
          <p className="text-text-secondary text-sm">ID: {id}</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowGraph(!showGraph)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 border ${
              showGraph ? 'border-accent-blue text-accent-blue' : 'border-border text-text-secondary'
            }`}
          >
            <Network size={18} />
            关系图谱
          </button>
          
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
      </div>
      
      <div className="grid grid-cols-4 gap-6">
        {/* 左侧面板 */}
        <div className="col-span-1 space-y-4">
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
          
          {/* 市场数据面板 */}
          <MarketPanel data={latestMarketData} />
        </div>
        
        {/* 右侧主区域 */}
        <div className="col-span-3 space-y-4">
          {/* 关系图谱 */}
          {showGraph && (
            <div className="bg-card-bg border border-border rounded-xl overflow-hidden">
              <div className="p-4 border-b border-border">
                <h2 className="font-semibold flex items-center gap-2">
                  <Network size={18} />
                  智能体关系图谱
                </h2>
              </div>
              <AgentGraph nodes={graphData.nodes} edges={graphData.edges} height={300} />
            </div>
          )}
          
          {/* 实时日志 */}
          <div className="bg-card-bg border border-border rounded-xl">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold">实时事件日志</h2>
            </div>
            <div ref={logRef} className="h-80 overflow-y-auto p-4 font-mono text-sm">
              {ticks.map((tick, i) => (
                <div key={i} className="mb-3">
                  <div className="text-text-secondary text-xs">
                    {new Date(tick.time).toLocaleTimeString()}
                  </div>
                  {tick.agent_actions.map((action, j) => (
                    <div key={j} className={`ml-4 ${
                      action.action === 'buy' ? 'text-accent-green' : 'text-accent-red'
                    }`}>
                      <span className="text-text-secondary">[{action.agent_type.replace('_trader', '')}]</span>{' '}
                      {action.agent_id.slice(0, 8)}...{' '}
                      <span className="font-semibold">{action.action.toUpperCase()}</span>{' '}
                      {action.symbol} ${action.amount.toLocaleString()}
                      <span className="text-text-secondary ml-2">— {action.reason}</span>
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
      </div>
    </div>
  )
}
