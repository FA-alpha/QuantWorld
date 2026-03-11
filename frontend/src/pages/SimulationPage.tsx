import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Play, Pause, SkipForward, RefreshCw, TrendingUp, TrendingDown, Activity, Circle } from 'lucide-react'
import ForceGraph2D from 'react-force-graph-2d'

interface AgentPersona {
  id: string
  name: string
  type: string
  typeLabel: string
  age: number
  gender: string
  mbti?: string
  location: string
  bio: string
  tags: string[]
  background: { experience: string; behavior: string; memory: string; socialNetwork: string }
}

interface AgentAction {
  id: string
  agentId: string
  agentName: string
  type: 'post' | 'trade' | 'comment' | 'repost'
  content: string
  timestamp: Date
  symbol?: string
  direction?: 'long' | 'short'
  sentiment?: number
}

interface PriceData {
  symbol: string
  price: number
  change: number
  volume: number
}

const typeColors: Record<string, string> = {
  'retail': '#ef6c6c', 'institutional': '#5cba8f', 'whale': '#5a9bd5', 'analyst': '#9b7ed9', 'kol': '#e5a54b',
  '散户': '#ef6c6c', '机构': '#5cba8f', '巨鲸': '#5a9bd5', '分析师': '#9b7ed9', 'KOL': '#e5a54b',
  'BTC': '#f7931a', 'ETH': '#627eea', 'SOL': '#00d18c', 'default': '#8b949e'
}

// 真实价格（近似值）
const realPrices: Record<string, number> = {
  'BTC': 95000,
  'ETH': 3300,
  'SOL': 180,
  'DOGE': 0.32,
  'XRP': 2.2,
  'ADA': 0.75,
  'BCH': 420
}

export default function SimulationPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const graphRef = useRef<any>()
  
  const [isRunning, setIsRunning] = useState(false)
  const [currentRound, setCurrentRound] = useState(1)
  const [totalRounds] = useState(72)
  const [speed, setSpeed] = useState(1)
  
  const [agents, setAgents] = useState<AgentPersona[]>([])
  const [selectedAgent, setSelectedAgent] = useState<AgentPersona | null>(null)
  const [consoleConfig, setConsoleConfig] = useState<any>(null)
  
  useEffect(() => {
    const stored = sessionStorage.getItem(`agents_${id}`)
    if (stored) setAgents(JSON.parse(stored))
    const config = sessionStorage.getItem(`config_${id}`)
    if (config) setConsoleConfig(JSON.parse(config))
  }, [id])
  
  // 根据配置的 symbols 初始化价格
  const [prices, setPrices] = useState<PriceData[]>([])
  
  useEffect(() => {
    const symbols = consoleConfig?.symbols || ['BTC', 'ETH', 'SOL']
    setPrices(symbols.map((s: string) => ({
      symbol: s,
      price: realPrices[s] || 100,
      change: (Math.random() - 0.5) * 4,
      volume: Math.random() * 10 + 1
    })))
  }, [consoleConfig])
  
  const [actions, setActions] = useState<AgentAction[]>([])
  
  useEffect(() => {
    if (!isRunning || agents.length === 0) return
    
    const interval = setInterval(() => {
      setCurrentRound(prev => {
        if (prev >= totalRounds) { setIsRunning(false); return prev }
        return prev + 1
      })
      
      setPrices(prev => prev.map(p => ({
        ...p,
        price: p.price * (1 + (Math.random() - 0.5) * 0.01),
        change: (Math.random() - 0.5) * 6,
        volume: p.volume * (0.9 + Math.random() * 0.2)
      })))
      
      if (Math.random() > 0.3 && agents.length > 0) {
        const randomAgent = agents[Math.floor(Math.random() * agents.length)]
        const actionTypes: Array<'post' | 'trade' | 'comment' | 'repost'> = ['post', 'trade', 'comment', 'repost']
        const actionType = actionTypes[Math.floor(Math.random() * actionTypes.length)]
        
        const actionContents: Record<string, string[]> = {
          post: ['看好后市，准备加仓！', '这波调整是机会', '大家注意风控', '技术面出现金叉', '链上数据显示资金流入'],
          trade: ['开多 BTC', '开空 ETH', '加仓 SOL', '减仓观望', '止盈离场'],
          comment: ['同意楼上观点', '这分析有点道理', '不太确定', '等等看吧', '已经上车'],
          repost: ['转发：重要消息', '转发：链上数据分析', '转发：KOL观点', '转发：市场解读', '转发：风险提示']
        }
        
        const newAction: AgentAction = {
          id: `action_${Date.now()}`,
          agentId: randomAgent.id,
          agentName: randomAgent.name,
          type: actionType,
          content: actionContents[actionType][Math.floor(Math.random() * actionContents[actionType].length)],
          timestamp: new Date(),
          symbol: prices[Math.floor(Math.random() * prices.length)]?.symbol || 'BTC',
          direction: Math.random() > 0.5 ? 'long' : 'short',
          sentiment: Math.random() * 2 - 1
        }
        
        setActions(prev => [newAction, ...prev].slice(0, 50))
      }
    }, 2000 / speed)
    
    return () => clearInterval(interval)
  }, [isRunning, speed, agents, totalRounds, prices])
  
  const graphData = useMemo(() => {
    const nodes: any[] = []
    const links: any[] = []
    
    agents.forEach(a => {
      const recentActions = actions.filter(act => act.agentId === a.id).length
      nodes.push({
        id: a.id, name: a.name, type: a.type, typeLabel: a.typeLabel,
        val: (a.type === 'whale' ? 35 : a.type === 'institutional' ? 28 : 18) + recentActions * 2,
        color: typeColors[a.type] || typeColors.default,
        isAgent: true, recentActions
      })
    })
    
    prices.forEach(p => {
      nodes.push({ id: p.symbol.toLowerCase(), name: p.symbol, type: 'symbol', val: 40, color: typeColors[p.symbol] || '#8b949e', isAgent: false })
    })
    
    agents.forEach(a => {
      const agentActions = actions.filter(act => act.agentId === a.id)
      agentActions.forEach(act => {
        if (act.symbol) links.push({ source: a.id, target: act.symbol.toLowerCase() })
      })
      if (a.type === 'retail') {
        const kols = agents.filter(x => x.type === 'kol')
        kols.forEach(kol => { if (Math.random() > 0.7) links.push({ source: a.id, target: kol.id }) })
      }
    })
    
    return { nodes, links }
  }, [agents, actions, prices])
  
  const typeStats = useMemo(() => {
    const stats: Record<string, number> = {}
    agents.forEach(a => { stats[a.typeLabel] = (stats[a.typeLabel] || 0) + 1 })
    return Object.entries(stats)
  }, [agents])
  
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header - 与 Process 页面一致 */}
      <header className="border-b border-gray-200 bg-white px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/process/${id}`)} className="text-gray-400 hover:text-gray-600 text-xl">←</button>
          <h1 className="text-xl font-bold text-gray-800">{consoleConfig?.projectName || 'QuantWorld'}</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">Round {currentRound}/{totalRounds}</span>
          <span className={`flex items-center gap-1 text-sm ${isRunning ? 'text-emerald-600' : 'text-gray-500'}`}>
            <Circle size={8} className={isRunning ? 'fill-emerald-500' : 'fill-gray-400'} /> 
            {isRunning ? '运行中' : '已暂停'}
          </span>
        </div>
      </header>
      
      {/* Main - 全屏布局 */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Graph */}
        <div className="w-1/2 p-4 border-r border-gray-200">
          <div className="h-full bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col">
            {/* 行情面板 */}
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">实时行情</h3>
              <div className="grid grid-cols-3 gap-3">
                {prices.map(p => (
                  <div key={p.symbol} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-800">{p.symbol}</span>
                      <span className={`flex items-center gap-1 text-xs ${p.change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {p.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {p.change >= 0 ? '+' : ''}{p.change.toFixed(2)}%
                      </span>
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      ${p.price < 1 ? p.price.toFixed(4) : p.price.toLocaleString(undefined, {maximumFractionDigits: 2})}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* 图谱 */}
            <div className="flex-1 relative bg-gray-50">
              <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10">
                <h2 className="font-semibold text-gray-800 bg-white/80 px-3 py-1 rounded-lg">智能体关系图谱</h2>
                <button className="text-sm text-gray-400 hover:text-gray-600 bg-white/80 px-2 py-1 rounded-lg"><RefreshCw size={14} /></button>
              </div>
              <ForceGraph2D
                ref={graphRef}
                graphData={graphData}
                nodeLabel="name"
                nodeColor={(node: any) => node.color}
                nodeVal={(node: any) => node.val}
                linkColor={() => 'rgba(156, 163, 175, 0.3)'}
                linkWidth={1}
                backgroundColor="#f9fafb"
                nodeCanvasObject={(node: any, ctx, globalScale) => {
                  const label = node.name
                  const fontSize = Math.max(10 / globalScale, 4)
                  const nodeSize = Math.sqrt(node.val) * 1.6
                  
                  if (node.recentActions > 0) {
                    ctx.beginPath()
                    ctx.arc(node.x, node.y, nodeSize + 4, 0, 2 * Math.PI)
                    ctx.fillStyle = `${node.color}30`
                    ctx.fill()
                  }
                  
                  ctx.beginPath()
                  ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI)
                  ctx.fillStyle = node.color
                  ctx.fill()
                  ctx.strokeStyle = 'rgba(255,255,255,0.9)'
                  ctx.lineWidth = 2
                  ctx.stroke()
                  
                  ctx.font = `500 ${fontSize}px -apple-system, sans-serif`
                  ctx.textAlign = 'center'
                  ctx.textBaseline = 'top'
                  ctx.fillStyle = '#374151'
                  ctx.fillText(label, node.x, node.y + nodeSize + 4)
                }}
                cooldownTicks={50}
                onNodeClick={(node: any) => {
                  if (node.isAgent) {
                    const agent = agents.find(a => a.id === node.id)
                    if (agent) setSelectedAgent(agent)
                  }
                }}
              />
              
              <div className="absolute bottom-4 left-4 bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
                <div className="text-xs text-gray-500 mb-2 font-semibold">ENTITY TYPES</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  {typeStats.map(([label, count]) => (
                    <div key={label} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: typeColors[label] }} />
                      <span className="text-gray-700">{label}</span>
                      <span className="text-gray-400">({count})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right: Controls + Actions */}
        <div className="w-1/2 flex flex-col p-4 gap-4">
          {/* 控制面板 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{agents.length}</div>
                  <div className="text-xs text-gray-500">Agent</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{actions.filter(a => a.type === 'post').length}</div>
                  <div className="text-xs text-gray-500">发帖</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">{actions.filter(a => a.type === 'trade').length}</div>
                  <div className="text-xs text-gray-500">交易</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{Math.round((actions.filter(a => (a.sentiment || 0) > 0).length / Math.max(actions.length, 1)) * 100)}%</div>
                  <div className="text-xs text-gray-500">看多</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select value={speed} onChange={e => setSpeed(Number(e.target.value))} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700">
                  <option value={0.5}>0.5x</option>
                  <option value={1}>1x</option>
                  <option value={2}>2x</option>
                  <option value={5}>5x</option>
                </select>
                <button onClick={() => setIsRunning(!isRunning)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${isRunning ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}>
                  {isRunning ? <><Pause size={18} /> 暂停</> : <><Play size={18} /> 运行</>}
                </button>
                <button onClick={() => setCurrentRound(prev => Math.min(prev + 1, totalRounds))} className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">
                  <SkipForward size={18} />
                </button>
              </div>
            </div>
            
            {/* 进度条 */}
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${(currentRound / totalRounds) * 100}%` }} />
            </div>
          </div>
          
          {/* 实时动态 */}
          <div className="flex-1 bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Activity size={18} className="text-blue-500" />
                实时动态
              </h2>
              <span className="text-xs text-gray-500">{actions.length} 条记录</span>
            </div>
            <div className="h-[calc(100%-60px)] overflow-y-auto p-4 space-y-3">
              {actions.length === 0 ? (
                <div className="text-center text-gray-400 py-10">点击"运行"开始模拟</div>
              ) : (
                actions.map(action => (
                  <div key={action.id} className="bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition cursor-pointer" onClick={() => {
                    const agent = agents.find(a => a.id === action.agentId)
                    if (agent) setSelectedAgent(agent)
                  }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">{action.agentName}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          action.type === 'trade' ? 'bg-emerald-100 text-emerald-700' :
                          action.type === 'post' ? 'bg-blue-100 text-blue-700' :
                          action.type === 'comment' ? 'bg-purple-100 text-purple-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {action.type === 'trade' ? '交易' : action.type === 'post' ? '发帖' : action.type === 'comment' ? '评论' : '转发'}
                        </span>
                        {action.symbol && <span className="text-xs text-gray-500">{action.symbol}</span>}
                      </div>
                      <span className="text-xs text-gray-400">{action.timestamp.toLocaleTimeString()}</span>
                    </div>
                    <p className="text-sm text-gray-600">{action.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Agent Detail Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-start justify-center pt-16 z-50" onClick={() => setSelectedAgent(null)}>
          <div className="bg-white rounded-2xl w-[500px] shadow-2xl border border-gray-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">{selectedAgent.name}</h3>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: typeColors[selectedAgent.type] }}>{selectedAgent.typeLabel}</span>
                <button onClick={() => setSelectedAgent(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
              </div>
            </div>
            <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-3"><div className="text-xs text-gray-500">年龄</div><div className="font-medium text-gray-800">{selectedAgent.age} 岁</div></div>
                <div className="bg-gray-50 rounded-xl p-3"><div className="text-xs text-gray-500">性别</div><div className="font-medium text-gray-800">{selectedAgent.gender}</div></div>
                <div className="bg-gray-50 rounded-xl p-3"><div className="text-xs text-gray-500">地区</div><div className="font-medium text-gray-800">{selectedAgent.location}</div></div>
                <div className="bg-gray-50 rounded-xl p-3"><div className="text-xs text-gray-500">MBTI</div><div className="font-medium text-emerald-600">{selectedAgent.mbti}</div></div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-2">简介</div>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{selectedAgent.bio}</p>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-2">历史操作</div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {actions.filter(a => a.agentId === selectedAgent.id).slice(0, 10).map(action => (
                    <div key={action.id} className="bg-gray-50 rounded-lg p-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-2 py-0.5 rounded ${action.type === 'trade' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{action.type}</span>
                        <span className="text-xs text-gray-400">{action.timestamp.toLocaleTimeString()}</span>
                      </div>
                      <p className="text-gray-600 mt-1">{action.content}</p>
                    </div>
                  ))}
                  {actions.filter(a => a.agentId === selectedAgent.id).length === 0 && (
                    <div className="text-center text-gray-400 text-sm py-4">暂无操作记录</div>
                  )}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-2">标签</div>
                <div className="flex flex-wrap gap-2">
                  {selectedAgent.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full text-sm border border-gray-200 text-gray-600">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
