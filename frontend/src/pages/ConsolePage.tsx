import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Settings, Users, Zap, ChevronRight } from 'lucide-react'

interface AgentConfig {
  type: string
  label: string
  count: number
  template: string
  color: string
}

interface EventInput {
  title: string
  content: string
  type: string
}

export default function ConsolePage() {
  const navigate = useNavigate()
  
  const [projectName, setProjectName] = useState('加密市场仿真')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState(72)
  const [intervalMinutes, setIntervalMinutes] = useState(60)
  
  const [agents, setAgents] = useState<AgentConfig[]>([
    { type: 'retail', label: '散户', count: 5, template: 'retail_newbie', color: '#F85149' },
    { type: 'institutional', label: '机构', count: 2, template: 'institution_fund', color: '#3FB950' },
    { type: 'whale', label: '巨鲸', count: 1, template: 'whale_og', color: '#58A6FF' },
    { type: 'analyst', label: '分析师', count: 2, template: 'analyst_technical', color: '#A371F7' },
    { type: 'kol', label: 'KOL', count: 2, template: 'kol_influencer', color: '#D29922' },
  ])
  
  const [eventInput, setEventInput] = useState<EventInput>({
    title: '',
    content: '',
    type: 'custom'
  })
  
  const [events, setEvents] = useState<EventInput[]>([])
  
  const [symbols, setSymbols] = useState(['BTC', 'ETH', 'SOL'])
  const availableSymbols = ['BTC', 'ETH', 'SOL', 'DOGE', 'XRP', 'ADA', 'BCH']
  
  const eventTypes = [
    { value: 'macro_policy', label: '宏观政策', example: '美联储宣布降息50基点' },
    { value: 'regulatory', label: '监管政策', example: 'SEC 批准以太坊 ETF' },
    { value: 'exchange', label: '交易所事件', example: '某交易所宣布暴雷' },
    { value: 'whale_move', label: '巨鲸动向', example: '巨鲸地址转移 1000 BTC 到交易所' },
    { value: 'price_spike', label: '价格波动', example: 'BTC 突破 10 万美元' },
    { value: 'custom', label: '自定义', example: '' },
  ]
  
  const updateAgentCount = (type: string, value: number) => {
    setAgents(prev => prev.map(a => 
      a.type === type ? { ...a, count: Math.max(0, Math.min(100, value)) } : a
    ))
  }
  
  const addEvent = () => {
    if (eventInput.content.trim()) {
      setEvents(prev => [...prev, { ...eventInput }])
      setEventInput({ title: '', content: '', type: 'custom' })
    }
  }
  
  const removeEvent = (index: number) => {
    setEvents(prev => prev.filter((_, i) => i !== index))
  }
  
  const totalAgents = agents.reduce((sum, a) => sum + a.count, 0)
  
  const startSimulation = () => {
    // 生成唯一ID
    const simId = `sim_${Date.now().toString(36)}`
    
    // 将配置存储到 sessionStorage
    const config = {
      projectName,
      description,
      duration,
      intervalMinutes,
      agents,
      events,
      symbols
    }
    sessionStorage.setItem(`config_${simId}`, JSON.stringify(config))
    
    // 跳转到流程页面
    navigate(`/process/${simId}`)
  }
  
  return (
    <div className="max-w-6xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">创建仿真项目</h1>
        <p className="text-text-secondary">配置多智能体市场仿真参数</p>
      </div>
      
      <div className="grid grid-cols-3 gap-6">
        {/* 左侧：基础配置 */}
        <div className="col-span-2 space-y-6">
          {/* 项目信息 */}
          <div className="bg-card-bg border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Settings size={20} className="text-accent-blue" />
              项目信息
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">项目名称</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  className="w-full bg-dark-bg border border-border rounded-lg px-4 py-2 focus:border-accent-blue outline-none"
                  placeholder="输入项目名称..."
                />
              </div>
              
              <div>
                <label className="block text-sm text-text-secondary mb-1">项目描述（可选）</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-dark-bg border border-border rounded-lg px-4 py-2 focus:border-accent-blue outline-none h-20 resize-none"
                  placeholder="描述仿真目的..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-text-secondary mb-1">仿真时长（小时）</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={e => setDuration(parseInt(e.target.value) || 0)}
                    className="w-full bg-dark-bg border border-border rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">时间间隔（分钟）</label>
                  <input
                    type="number"
                    value={intervalMinutes}
                    onChange={e => setIntervalMinutes(parseInt(e.target.value) || 0)}
                    className="w-full bg-dark-bg border border-border rounded-lg px-4 py-2"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-text-secondary mb-2">交易标的</label>
                <div className="flex gap-2 flex-wrap">
                  {availableSymbols.map(symbol => (
                    <button
                      key={symbol}
                      onClick={() => setSymbols(prev => 
                        prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol]
                      )}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                        symbols.includes(symbol)
                          ? 'bg-accent-blue/20 border-accent-blue text-accent-blue'
                          : 'border-border text-text-secondary hover:border-text-secondary'
                      }`}
                    >
                      {symbol}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* 智能体配置 */}
          <div className="bg-card-bg border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users size={20} className="text-accent-blue" />
              智能体配置
              <span className="text-sm font-normal text-text-secondary ml-2">共 {totalAgents} 个</span>
            </h2>
            
            <div className="space-y-3">
              {agents.map(agent => (
                <div key={agent.type} className="flex items-center justify-between bg-dark-bg rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: agent.color }} />
                    <span className="font-medium w-16">{agent.label}</span>
                    <span className="text-xs text-text-secondary bg-card-bg px-2 py-0.5 rounded">
                      {agent.template}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateAgentCount(agent.type, agent.count - 1)}
                      className="w-8 h-8 rounded bg-card-bg border border-border hover:border-accent-blue flex items-center justify-center text-lg"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={agent.count}
                      onChange={e => updateAgentCount(agent.type, parseInt(e.target.value) || 0)}
                      className="w-16 text-center font-mono bg-card-bg border border-border rounded px-2 py-1 focus:border-accent-blue outline-none"
                      min="0"
                      max="100"
                    />
                    <button
                      onClick={() => updateAgentCount(agent.type, agent.count + 1)}
                      className="w-8 h-8 rounded bg-card-bg border border-border hover:border-accent-blue flex items-center justify-center text-lg"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* 事件输入 */}
          <div className="bg-card-bg border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Zap size={20} className="text-accent-blue" />
              初始事件
              <span className="text-sm font-normal text-text-secondary ml-2">
                输入触发仿真的市场事件
              </span>
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">事件类型</label>
                <select
                  value={eventInput.type}
                  onChange={e => setEventInput(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full bg-dark-bg border border-border rounded-lg px-4 py-2"
                >
                  {eventTypes.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-text-secondary mb-1">事件标题</label>
                <input
                  type="text"
                  value={eventInput.title}
                  onChange={e => setEventInput(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-dark-bg border border-border rounded-lg px-4 py-2"
                  placeholder={eventTypes.find(t => t.value === eventInput.type)?.example || '输入事件标题...'}
                />
              </div>
              
              <div>
                <label className="block text-sm text-text-secondary mb-1">事件详情</label>
                <textarea
                  value={eventInput.content}
                  onChange={e => setEventInput(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full bg-dark-bg border border-border rounded-lg px-4 py-2 h-24 resize-none"
                  placeholder="详细描述事件内容，将用于影响智能体行为..."
                />
              </div>
              
              <button
                onClick={addEvent}
                disabled={!eventInput.content.trim()}
                className="w-full py-2 rounded-lg border border-dashed border-border text-text-secondary hover:border-accent-blue hover:text-accent-blue disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                + 添加事件
              </button>
              
              {/* 已添加的事件 */}
              {events.length > 0 && (
                <div className="space-y-2 mt-4">
                  <div className="text-sm text-text-secondary">已添加 {events.length} 个事件</div>
                  {events.map((event, i) => (
                    <div key={i} className="flex items-start gap-3 bg-dark-bg rounded-lg p-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs bg-accent-blue/20 text-accent-blue px-2 py-0.5 rounded">
                            {eventTypes.find(t => t.value === event.type)?.label}
                          </span>
                          <span className="font-medium text-sm">{event.title || '未命名事件'}</span>
                        </div>
                        <p className="text-sm text-text-secondary line-clamp-2">{event.content}</p>
                      </div>
                      <button
                        onClick={() => removeEvent(i)}
                        className="text-text-secondary hover:text-accent-red text-xl"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* 右侧：预览和启动 */}
        <div className="space-y-6">
          {/* 配置预览 */}
          <div className="bg-card-bg border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4">配置预览</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">项目名称</span>
                <span>{projectName || '未命名'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">仿真时长</span>
                <span>{duration} 小时</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">时间间隔</span>
                <span>{intervalMinutes} 分钟</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">总轮次</span>
                <span>{Math.floor(duration * 60 / intervalMinutes)} 轮</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">智能体总数</span>
                <span>{totalAgents} 个</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">交易标的</span>
                <span>{symbols.join(', ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">初始事件</span>
                <span>{events.length} 个</span>
              </div>
            </div>
          </div>
          
          {/* 智能体分布 */}
          <div className="bg-card-bg border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4">智能体分布</h3>
            
            <div className="space-y-2">
              {agents.filter(a => a.count > 0).map(agent => (
                <div key={agent.type} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: agent.color }} />
                  <span className="text-sm flex-1">{agent.label}</span>
                  <span className="text-sm text-text-secondary w-8 text-right">{agent.count}</span>
                  <div className="w-24 bg-dark-bg rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ 
                        backgroundColor: agent.color,
                        width: `${(agent.count / Math.max(totalAgents, 1)) * 100}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* 启动按钮 */}
          <button
            onClick={startSimulation}
            disabled={totalAgents === 0}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-accent-blue to-accent-purple text-white font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            <Play size={20} />
            开始环境搭建
            <ChevronRight size={20} />
          </button>
          
          <p className="text-xs text-text-secondary text-center">
            点击后将进入 5 步环境搭建流程
          </p>
        </div>
      </div>
    </div>
  )
}
