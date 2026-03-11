import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Plus, Settings, Users } from 'lucide-react'

interface SimConfig {
  name: string
  duration: number
  intervalHours: number
  agents: {
    retail: number
    institutional: number
    whale: number
  }
  symbols: string[]
}

export default function ConsolePage() {
  const navigate = useNavigate()
  const [config, setConfig] = useState<SimConfig>({
    name: '新仿真项目',
    duration: 168, // 7 days in hours
    intervalHours: 1,
    agents: {
      retail: 50,
      institutional: 10,
      whale: 3
    },
    symbols: ['BTC', 'ETH', 'SOL']
  })
  
  const [simulations, setSimulations] = useState<any[]>([])
  
  const startSimulation = () => {
    const simId = `sim_${Date.now()}`
    setSimulations(prev => [...prev, { id: simId, ...config, status: 'running' }])
    navigate(`/simulation/${simId}`)
  }
  
  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">仿真控制台</h1>
      
      <div className="grid grid-cols-3 gap-6">
        {/* 配置面板 */}
        <div className="col-span-2 bg-card-bg border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Settings size={20} />
            仿真配置
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">项目名称</label>
              <input
                type="text"
                value={config.name}
                onChange={e => setConfig({...config, name: e.target.value})}
                className="w-full bg-dark-bg border border-border rounded-lg px-4 py-2"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">仿真时长（小时）</label>
                <input
                  type="number"
                  value={config.duration}
                  onChange={e => setConfig({...config, duration: parseInt(e.target.value)})}
                  className="w-full bg-dark-bg border border-border rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">时间间隔（小时）</label>
                <input
                  type="number"
                  value={config.intervalHours}
                  onChange={e => setConfig({...config, intervalHours: parseInt(e.target.value)})}
                  className="w-full bg-dark-bg border border-border rounded-lg px-4 py-2"
                />
              </div>
            </div>
            
            {/* 智能体数量 */}
            <div>
              <label className="block text-sm text-text-secondary mb-2 flex items-center gap-2">
                <Users size={16} />
                智能体数量
              </label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-text-secondary">散户</label>
                  <input
                    type="number"
                    value={config.agents.retail}
                    onChange={e => setConfig({...config, agents: {...config.agents, retail: parseInt(e.target.value)}})}
                    className="w-full bg-dark-bg border border-border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-secondary">机构</label>
                  <input
                    type="number"
                    value={config.agents.institutional}
                    onChange={e => setConfig({...config, agents: {...config.agents, institutional: parseInt(e.target.value)}})}
                    className="w-full bg-dark-bg border border-border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-secondary">巨鲸</label>
                  <input
                    type="number"
                    value={config.agents.whale}
                    onChange={e => setConfig({...config, agents: {...config.agents, whale: parseInt(e.target.value)}})}
                    className="w-full bg-dark-bg border border-border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
            
            {/* 币种选择 */}
            <div>
              <label className="block text-sm text-text-secondary mb-2">交易币种</label>
              <div className="flex gap-2 flex-wrap">
                {['BTC', 'ETH', 'SOL', 'DOGE', 'XRP', 'ADA', 'BCH'].map(symbol => (
                  <button
                    key={symbol}
                    onClick={() => {
                      const symbols = config.symbols.includes(symbol)
                        ? config.symbols.filter(s => s !== symbol)
                        : [...config.symbols, symbol]
                      setConfig({...config, symbols})
                    }}
                    className={`px-3 py-1 rounded-lg text-sm border transition
                      ${config.symbols.includes(symbol)
                        ? 'bg-accent-blue/20 border-accent-blue text-accent-blue'
                        : 'border-border text-text-secondary hover:border-text-secondary'}`}
                  >
                    {symbol}
                  </button>
                ))}
              </div>
            </div>
            
            <button
              onClick={startSimulation}
              className="w-full bg-accent-blue text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-accent-blue/80 transition mt-6"
            >
              <Play size={20} />
              开始仿真
            </button>
          </div>
        </div>
        
        {/* 历史记录 */}
        <div className="bg-card-bg border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">仿真历史</h2>
          {simulations.length === 0 ? (
            <p className="text-text-secondary text-sm">暂无仿真记录</p>
          ) : (
            <div className="space-y-2">
              {simulations.map(sim => (
                <div
                  key={sim.id}
                  onClick={() => navigate(`/simulation/${sim.id}`)}
                  className="p-3 bg-dark-bg rounded-lg cursor-pointer hover:border-accent-blue border border-transparent transition"
                >
                  <div className="font-medium">{sim.name}</div>
                  <div className="text-xs text-text-secondary">{sim.id}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
