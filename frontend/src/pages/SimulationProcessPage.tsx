import { useState, useRef, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Check, Circle, RefreshCw, ChevronRight, Edit2, Save } from 'lucide-react'
import ForceGraph2D from 'react-force-graph-2d'

type StepStatus = 'pending' | 'running' | 'completed'

interface Step {
  id: number
  title: string
  description: string
  status: StepStatus
}

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
  background: {
    experience: string
    behavior: string
    memory: string
    socialNetwork: string
  }
}

interface SimConfig {
  duration_hours: number
  rounds_per_hour: number
  total_rounds: number
  time_per_round: string
  time_slots: { name: string; range: string; coefficient: number }[]
}

interface ConfigFromConsole {
  projectName: string
  description: string
  duration: number
  intervalMinutes: number
  agents: { type: string; label: string; count: number; template: string; color: string }[]
  events: { title: string; content: string; type: string }[]
  symbols: string[]
}

// 根据事件类型生成叙事方向
const generateNarrative = (event: { title: string; content: string; type: string } | undefined) => {
  if (!event || !event.content) {
    return '市场对该事件的反应将分化：一部分交易者认为这是利好信号，另一部分则担忧潜在风险。'
  }
  
  const eventType = event.type
  const content = event.content
  
  const narratives: Record<string, string> = {
    'macro_policy': `宏观政策事件「${event.title || content.slice(0, 20)}」将引发市场重新定价。机构投资者将率先调整仓位，散户可能出现滞后反应。市场波动性预计上升，不同资产类别表现分化。`,
    'regulatory': `监管政策变化「${event.title || content.slice(0, 20)}」将对市场产生深远影响。合规机构将迅速响应，部分交易者可能选择观望。市场情绪将经历从恐慌到理性的转变过程。`,
    'exchange': `交易所事件「${event.title || content.slice(0, 20)}」引发市场恐慌。用户可能出现挤兑行为，资金将流向被认为更安全的平台。恐慌情绪可能在社交媒体上迅速扩散。`,
    'whale_move': `巨鲸动向「${event.title || content.slice(0, 20)}」被链上分析师捕捉。消息将在社交媒体上快速传播，散户可能跟风操作。市场短期内可能出现较大波动。`,
    'price_spike': `价格剧烈波动「${event.title || content.slice(0, 20)}」触发多空双方激烈博弈。FOMO 情绪与恐慌情绪交织，市场成交量预计大幅上升。`,
    'custom': `事件「${event.title || content.slice(0, 30)}」将在市场中引发连锁反应。不同类型的市场参与者将基于各自的信息渠道和风险偏好做出差异化决策。`
  }
  
  return narratives[eventType] || narratives['custom']
}

// 角色模板
const personaTemplates: Record<string, Omit<AgentPersona, 'id' | 'name' | 'type' | 'typeLabel'>> = {
  retail: { age: 25, gender: '男', mbti: 'ESFP', location: '中国', bio: '刚入币圈的新人，听说炒币能暴富就进来了。喜欢看 KOL 推荐，容易 FOMO，追涨杀跌。', tags: ['FOMO', '追涨杀跌', 'KOL跟单', '短线交易'], background: { experience: '新手阶段，正在学习', behavior: '情绪化决策，容易被市场影响', memory: '第一次经历大跌还在适应', socialNetwork: '关注多个 KOL 和社群' } },
  institutional: { age: 38, gender: '男', mbti: 'ENTJ', location: '新加坡', bio: '某加密基金交易员，管理着数亿美元规模的仓位。注重风控，使用量化策略。', tags: ['量化交易', '风险控制', '大资金', '合规'], background: { experience: '传统金融背景，转型加密', behavior: '理性、数据驱动', memory: 'FTX 事件后更注重安全', socialNetwork: '与多家交易所和托管方联系' } },
  whale: { age: 45, gender: '男', mbti: 'INTJ', location: '美国', bio: '2013年开始接触 BTC 的 OG，经历过多轮牛熊。喜欢在别人恐慌时抄底，逆向投资思维。', tags: ['逆向投资', '长期持有', '底部抄底', '信息灵通'], background: { experience: '多轮牛熊周期的完整经历', behavior: '逆向思维，耐心等待', memory: '2017年牛市、2020年DeFi夏天', socialNetwork: '与多家机构有联系' } },
  analyst: { age: 30, gender: '女', mbti: 'INTP', location: '香港', bio: '专注链上数据分析，擅长从巨鲸动向和交易所流入流出预测市场走势。', tags: ['链上分析', '数据驱动', '技术派', '深度研究'], background: { experience: '数据科学背景', behavior: '客观、重视证据', memory: '多次成功预测大行情', socialNetwork: '在 Twitter 有大量粉丝' } },
  kol: { age: 28, gender: '男', mbti: 'ENFP', location: '迪拜', bio: 'Twitter 50万粉丝的加密 KOL，擅长带节奏和制造 FOMO。经常喊单，有时候准有时候不准。', tags: ['带货', 'FOMO制造', '喊单', '流量'], background: { experience: '从小博主成长起来', behavior: '夸张、煽动性', memory: '靠 meme 币起家', socialNetwork: '与项目方有利益关系' } }
}

const typeColors: Record<string, string> = {
  'retail': '#ef6c6c', 'institutional': '#5cba8f', 'whale': '#5a9bd5', 'analyst': '#9b7ed9', 'kol': '#e5a54b',
  '散户': '#ef6c6c', '机构': '#5cba8f', '巨鲸': '#5a9bd5', '分析师': '#9b7ed9', 'KOL': '#e5a54b',
  'BTC': '#f7931a', 'ETH': '#627eea', 'SOL': '#00d18c', 'exchange': '#8b949e', 'twitter': '#1da1f2', 'default': '#8b949e'
}

export default function SimulationProcessPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const graphRef = useRef<any>()
  
  const [consoleConfig, setConsoleConfig] = useState<ConfigFromConsole | null>(null)
  
  useEffect(() => {
    const stored = sessionStorage.getItem(`config_${id}`)
    if (stored) setConsoleConfig(JSON.parse(stored))
  }, [id])
  
  const [steps] = useState<Step[]>([
    { id: 1, title: '模拟实例初始化', description: '新建 simulation 实例，拉取模拟世界参数模版', status: 'completed' },
    { id: 2, title: '生成 Agent 人设', description: '结合上下文与现实种子当前关联话题数，为每个实体生成完整的 Agent 人设', status: 'completed' },
    { id: 3, title: '生成模拟配置', description: 'LLM 根据模拟需求与 Agent 人设，生成双平台模拟配置参数', status: 'completed' },
    { id: 4, title: '初始激活编排', description: '基于叙事方向与 Agent 人设，编排初始激活序列', status: 'completed' },
    { id: 5, title: '准备完成', description: '模拟环境已准备完成，可以开始运行模拟', status: 'running' },
  ])
  
  // 可编辑的 agents 状态
  const [agents, setAgents] = useState<AgentPersona[]>([])
  const [selectedAgent, setSelectedAgent] = useState<AgentPersona | null>(null)
  const [editingAgent, setEditingAgent] = useState<AgentPersona | null>(null)
  
  // 初始化 agents
  useEffect(() => {
    if (!consoleConfig) return
    const result: AgentPersona[] = []
    consoleConfig.agents.forEach(agentType => {
      const template = personaTemplates[agentType.type]
      if (!template) return
      for (let i = 0; i < agentType.count; i++) {
        const idx = (i + 1).toString().padStart(3, '0')
        result.push({
          id: `${agentType.type}_${idx}`,
          name: `${agentType.label}_${idx}`,
          type: agentType.type,
          typeLabel: agentType.label,
          ...template,
          age: template.age + Math.floor(Math.random() * 10) - 5,
          gender: i % 3 === 0 ? '女' : '男',
        })
      }
    })
    setAgents(result)
  }, [consoleConfig])
  
  const config = useMemo<SimConfig>(() => {
    if (!consoleConfig) return { duration_hours: 72, rounds_per_hour: 60, total_rounds: 72, time_per_round: '10-27', time_slots: [{ name: '高峰时段', range: '19:00-22:00', coefficient: 1.5 }, { name: '工作时段', range: '9:00-18:00', coefficient: 0.7 }, { name: '早间时段', range: '6:00-8:00', coefficient: 0.4 }, { name: '低谷时段', range: '0:00-5:00', coefficient: 0.05 }] }
    return { duration_hours: consoleConfig.duration, rounds_per_hour: consoleConfig.intervalMinutes, total_rounds: Math.floor(consoleConfig.duration * 60 / consoleConfig.intervalMinutes), time_per_round: '10-27', time_slots: [{ name: '高峰时段', range: '19:00-22:00', coefficient: 1.5 }, { name: '工作时段', range: '9:00-18:00', coefficient: 0.7 }, { name: '早间时段', range: '6:00-8:00', coefficient: 0.4 }, { name: '低谷时段', range: '0:00-5:00', coefficient: 0.05 }] }
  }, [consoleConfig])
  
  // 事件联动的叙事
  const narrative = useMemo(() => {
    const topics = consoleConfig?.symbols || ['BTC', 'ETH', 'SOL']
    const event = consoleConfig?.events?.[0]
    return {
      direction: generateNarrative(event),
      topics: event ? [...topics, event.title || '突发事件'].slice(0, 5) : topics,
      initialSequence: agents.slice(0, 4).map((a, i) => ({
        type: a.typeLabel.toUpperCase(),
        agentId: a.name,
        content: `${a.typeLabel}开始${['建仓观望', '发布分析', '转发讨论', '跟风买入'][i] || '行动'}...`
      }))
    }
  }, [consoleConfig, agents])
  
  const logRef = useRef<HTMLDivElement>(null)
  
  const graphData = useMemo(() => {
    const nodes: any[] = []
    const links: any[] = []
    agents.forEach(a => {
      nodes.push({ id: a.id, name: a.name, type: a.type, typeLabel: a.typeLabel, val: a.type === 'whale' ? 35 : a.type === 'institutional' ? 28 : a.type === 'analyst' || a.type === 'kol' ? 22 : 15, color: typeColors[a.type] || typeColors.default, isAgent: true })
    })
    const symbols = consoleConfig?.symbols || ['BTC', 'ETH', 'SOL']
    symbols.forEach(s => { nodes.push({ id: s.toLowerCase(), name: s, type: 'symbol', typeLabel: '交易标的', val: 40, color: typeColors[s] || '#8B949E', isAgent: false }) })
    nodes.push({ id: 'twitter', name: 'Twitter', type: 'platform', typeLabel: '社交平台', val: 30, color: typeColors.twitter, isAgent: false }, { id: 'exchange', name: '交易所', type: 'platform', typeLabel: '交易平台', val: 30, color: typeColors.exchange, isAgent: false })
    agents.forEach(a => {
      symbols.forEach(s => { if (Math.random() > 0.5) links.push({ source: a.id, target: s.toLowerCase() }) })
      if (a.type === 'retail' || a.type === 'kol' || a.type === 'analyst') links.push({ source: a.id, target: 'twitter' })
      if (a.type === 'institutional' || a.type === 'whale') links.push({ source: a.id, target: 'exchange' })
      if (a.type === 'retail') { const kols = agents.filter(x => x.type === 'kol'); if (kols.length > 0) links.push({ source: a.id, target: kols[Math.floor(Math.random() * kols.length)].id }) }
    })
    return { nodes, links }
  }, [agents, consoleConfig])
  
  // 保存编辑的 agent
  const saveAgent = () => {
    if (!editingAgent) return
    setAgents(prev => prev.map(a => a.id === editingAgent.id ? editingAgent : a))
    setSelectedAgent(editingAgent)
    setEditingAgent(null)
  }
  
  const StepIndicator = ({ step }: { step: Step }) => (
    <div className={`flex items-start gap-3 p-4 rounded-xl transition-all ${step.status === 'completed' ? 'bg-emerald-50 border border-emerald-200' : step.status === 'running' ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step.status === 'completed' ? 'bg-emerald-500 text-white' : step.status === 'running' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
        {step.status === 'completed' ? <Check size={16} /> : step.id.toString().padStart(2, '0')}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">{step.title}</h3>
          <span className={`text-xs px-2 py-1 rounded-full ${step.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : step.status === 'running' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'}`}>
            {step.status === 'completed' ? '已完成' : step.status === 'running' ? '进行中' : '待执行'}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1">{step.description}</p>
      </div>
    </div>
  )
  
  const AgentCard = ({ agent, onClick }: { agent: AgentPersona; onClick: () => void }) => (
    <div className="bg-white rounded-xl p-4 border border-gray-200 hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all" onClick={onClick}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-gray-800">{agent.name}</span>
        <span className="text-xs text-gray-500">@{agent.typeLabel}</span>
      </div>
      <div className="text-sm mb-2">
        <span className="px-2 py-0.5 rounded text-xs text-white" style={{ backgroundColor: typeColors[agent.type] }}>{agent.typeLabel}</span>
      </div>
      <p className="text-sm text-gray-500 line-clamp-2">{agent.bio}</p>
      <div className="flex flex-wrap gap-1 mt-2">
        {agent.tags.slice(0, 3).map(tag => (<span key={tag} className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{tag}</span>))}
      </div>
    </div>
  )
  
  const typeStats = useMemo(() => { const stats: Record<string, number> = {}; agents.forEach(a => { stats[a.typeLabel] = (stats[a.typeLabel] || 0) + 1 }); return Object.entries(stats) }, [agents])
  
  // 启动模拟时保存配置
  const handleStartSimulation = () => {
    // 保存 agents 到 sessionStorage
    sessionStorage.setItem(`agents_${id}`, JSON.stringify(agents))
    sessionStorage.setItem(`narrative_${id}`, JSON.stringify(narrative))
    navigate(`/simulation/${id}`)
  }
  
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/console')} className="text-gray-400 hover:text-gray-600 text-xl">←</button>
          <h1 className="text-xl font-bold text-gray-800">{consoleConfig?.projectName || 'QuantWorld'}</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">Step 5/5 环境搭建</span>
          <span className="flex items-center gap-1 text-emerald-600 text-sm"><Circle size={8} className="fill-emerald-500" /> 就绪</span>
        </div>
      </header>
      
      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/2 p-4 border-r border-gray-200">
          <div className="h-full bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-lg text-gray-800">Graph Relationship Visualization</h2>
              <button className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1"><RefreshCw size={14} /> Refresh</button>
            </div>
            <div className="h-[calc(100%-60px)] relative bg-gray-50">
              <ForceGraph2D ref={graphRef} graphData={graphData} nodeLabel="name" nodeColor={(node: any) => node.color} nodeVal={(node: any) => node.val} linkColor={() => 'rgba(156, 163, 175, 0.4)'} linkWidth={1.5} backgroundColor="#f9fafb"
                nodeCanvasObject={(node: any, ctx, globalScale) => {
                  const label = node.name; const fontSize = Math.max(11 / globalScale, 4); const nodeSize = Math.sqrt(node.val) * 1.8
                  ctx.beginPath(); ctx.arc(node.x + 1, node.y + 2, nodeSize, 0, 2 * Math.PI); ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fill()
                  ctx.beginPath(); ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI); ctx.fillStyle = node.color; ctx.fill()
                  ctx.beginPath(); ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI); ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2; ctx.stroke()
                  ctx.font = `500 ${fontSize}px -apple-system, BlinkMacSystemFont, sans-serif`; const textWidth = ctx.measureText(label).width
                  ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.beginPath(); ctx.roundRect(node.x - textWidth / 2 - 4, node.y + nodeSize + 3, textWidth + 8, fontSize + 6, 3); ctx.fill()
                  ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillStyle = '#374151'; ctx.fillText(label, node.x, node.y + nodeSize + 6)
                }}
                cooldownTicks={100}
                onNodeClick={(node: any) => { if (node.isAgent) { const agent = agents.find(a => a.id === node.id); if (agent) setSelectedAgent(agent) } }}
              />
              <div className="absolute bottom-4 left-4 bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
                <div className="text-xs text-gray-500 mb-2 font-semibold">ENTITY TYPES</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  {typeStats.map(([label, count]) => (<div key={label} className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: typeColors[label] || typeColors.default }} /><span className="text-gray-700">{label}</span><span className="text-gray-400">({count})</span></div>))}
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: typeColors.twitter }} /><span className="text-gray-700">Platform</span></div>
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: typeColors.BTC }} /><span className="text-gray-700">Symbol</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="w-1/2 flex flex-col overflow-hidden bg-gray-50">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {steps.slice(0, 2).map(step => (<StepIndicator key={step.id} step={step} />))}
            
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-8">
                  <div className="text-center"><div className="text-3xl font-bold text-blue-600">{agents.length}</div><div className="text-xs text-gray-500">当前AGENT数</div></div>
                  <div className="text-center"><div className="text-3xl font-bold text-gray-800">{agents.length}</div><div className="text-xs text-gray-500">预期AGENT总数</div></div>
                  <div className="text-center"><div className="text-3xl font-bold text-purple-600">{consoleConfig?.symbols?.length || 3}</div><div className="text-xs text-gray-500">交易标的数</div></div>
                </div>
              </div>
              <h4 className="text-sm text-gray-500 mb-2">已生成的 AGENT 人设 <span className="text-blue-500">(点击可编辑)</span></h4>
              <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                {agents.map(agent => (<AgentCard key={agent.id} agent={agent} onClick={() => setSelectedAgent(agent)} />))}
              </div>
            </div>
            
            <StepIndicator step={steps[2]} />
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="bg-gray-50 rounded-xl p-3"><div className="text-xs text-gray-500">模拟时长</div><div className="text-2xl font-bold text-gray-800">{config.duration_hours} <span className="text-sm font-normal text-gray-500">小时</span></div></div>
                <div className="bg-gray-50 rounded-xl p-3"><div className="text-xs text-gray-500">每轮时长</div><div className="text-2xl font-bold text-gray-800">{config.rounds_per_hour} <span className="text-sm font-normal text-gray-500">分钟</span></div></div>
                <div className="bg-gray-50 rounded-xl p-3"><div className="text-xs text-gray-500">总轮次</div><div className="text-2xl font-bold text-gray-800">{config.total_rounds} <span className="text-sm font-normal text-gray-500">轮</span></div></div>
                <div className="bg-gray-50 rounded-xl p-3"><div className="text-xs text-gray-500">每小时活跃</div><div className="text-2xl font-bold text-gray-800">{config.time_per_round}</div></div>
              </div>
              <div className="space-y-2">
                {config.time_slots.map(slot => (<div key={slot.name} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2"><span className="text-gray-500">{slot.name}</span><span className="text-gray-700">{slot.range}</span><span className={`font-mono font-medium ${slot.coefficient > 1 ? 'text-emerald-600' : slot.coefficient < 0.5 ? 'text-orange-500' : 'text-gray-500'}`}>x{slot.coefficient}</span></div>))}
              </div>
            </div>
            
            <StepIndicator step={steps[3]} />
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <div className="mb-4">
                <h4 className="text-sm text-gray-500 mb-2">叙事引导方向 <span className="text-emerald-500">(根据输入事件自动生成)</span></h4>
                <p className="text-sm bg-blue-50 rounded-xl p-3 border-l-4 border-blue-400 text-gray-700">{narrative.direction}</p>
              </div>
              <div className="mb-4">
                <h4 className="text-sm text-gray-500 mb-2">初始热点话题</h4>
                <div className="flex flex-wrap gap-2">{narrative.topics.map(topic => (<span key={topic} className="text-sm text-rose-600 bg-rose-50 px-3 py-1 rounded-full">#{topic}</span>))}</div>
              </div>
              {narrative.initialSequence.length > 0 && (
                <div>
                  <h4 className="text-sm text-gray-500 mb-2">初始激活序列 ({narrative.initialSequence.length})</h4>
                  <div className="space-y-2">{narrative.initialSequence.map((seq, i) => (<div key={i} className="bg-gray-50 rounded-xl p-3 flex items-start gap-3"><span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded">{seq.type}</span><div className="flex-1"><span className="text-xs text-gray-500">Agent: {seq.agentId}</span><p className="text-sm text-gray-700 mt-1">{seq.content}</p></div></div>))}</div>
                </div>
              )}
            </div>
            
            <StepIndicator step={steps[4]} />
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-200 p-6">
              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-blue-600 mb-2">{config.total_rounds} <span className="text-lg font-normal text-gray-500">轮</span></div>
                <p className="text-sm text-gray-500">若首次运行，建议减少模拟轮数以便快速预览</p>
              </div>
              <div className="flex gap-4">
                <button onClick={() => navigate('/console')} className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 bg-white hover:bg-gray-50 transition font-medium">← 返回配置</button>
                <button className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-sm" onClick={handleStartSimulation}>启动双平台模拟<ChevronRight size={18} /></button>
              </div>
            </div>
          </div>
          
          <div className="h-28 bg-white border-t border-gray-200">
            <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between"><span className="text-xs text-gray-500 font-mono">SYSTEM DASHBOARD</span><span className="text-xs text-gray-400 font-mono">sim_{id?.slice(0, 12) || 'default'}</span></div>
            <div ref={logRef} className="h-20 overflow-y-auto p-2 font-mono text-xs text-emerald-600 bg-gray-50">
              <div>{new Date().toLocaleTimeString()}  ├─ Agent数量：{agents.length}个</div>
              <div>{new Date().toLocaleTimeString()}  ├─ 模拟时长：{config.duration_hours}小时</div>
              <div>{new Date().toLocaleTimeString()}  ├─ 事件：{consoleConfig?.events?.[0]?.title || '无'}</div>
              <div>{new Date().toLocaleTimeString()}  ✓ 环境搭建完成，可以开始模拟</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 查看/编辑 Agent 弹窗 */}
      {selectedAgent && !editingAgent && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-start justify-center pt-16 z-50" onClick={() => setSelectedAgent(null)}>
          <div className="bg-white rounded-2xl w-[420px] shadow-2xl border border-gray-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Node Details</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setEditingAgent({...selectedAgent})} className="text-blue-500 hover:text-blue-700 p-1"><Edit2 size={18} /></button>
                <span className="px-3 py-1 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: typeColors[selectedAgent.type] }}>{selectedAgent.typeLabel}</span>
                <button onClick={() => setSelectedAgent(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
              </div>
            </div>
            <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-3">
                <div className="flex"><span className="text-gray-500 w-24 text-sm">Name:</span><span className="text-gray-800 font-medium">{selectedAgent.name}</span></div>
                <div className="flex"><span className="text-gray-500 w-24 text-sm">ID:</span><span className="text-gray-800 font-mono text-sm">{selectedAgent.id}</span></div>
              </div>
              <div><div className="text-gray-500 text-sm font-medium mb-2">Properties:</div><div className="bg-gray-50 rounded-xl p-3 space-y-2 text-sm"><div className="flex"><span className="text-gray-500 w-28">age:</span><span className="text-gray-800">{selectedAgent.age} 岁</span></div><div className="flex"><span className="text-gray-500 w-28">gender:</span><span className="text-gray-800">{selectedAgent.gender}</span></div><div className="flex"><span className="text-gray-500 w-28">location:</span><span className="text-gray-800">{selectedAgent.location}</span></div><div className="flex"><span className="text-gray-500 w-28">mbti:</span><span className="text-emerald-600 font-medium">{selectedAgent.mbti || 'N/A'}</span></div></div></div>
              <div><div className="text-gray-500 text-sm font-medium mb-2">Summary:</div><p className="text-gray-700 text-sm leading-relaxed bg-gray-50 rounded-xl p-3">{selectedAgent.bio}</p></div>
              <div><div className="text-gray-500 text-sm font-medium mb-2">Labels:</div><div className="flex flex-wrap gap-2"><span className="px-3 py-1 rounded-full text-sm border border-gray-200 text-gray-700 bg-white">{selectedAgent.typeLabel}</span>{selectedAgent.tags.map(tag => (<span key={tag} className="px-3 py-1 rounded-full text-sm border border-gray-200 text-gray-500 bg-white">{tag}</span>))}</div></div>
            </div>
          </div>
        </div>
      )}
      
      {/* 编辑 Agent 弹窗 */}
      {editingAgent && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-start justify-center pt-10 z-50" onClick={() => setEditingAgent(null)}>
          <div className="bg-white rounded-2xl w-[500px] shadow-2xl border border-gray-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">编辑 Agent 人设</h3>
              <div className="flex items-center gap-2">
                <button onClick={saveAgent} className="text-emerald-500 hover:text-emerald-700 flex items-center gap-1 text-sm font-medium"><Save size={16} /> 保存</button>
                <button onClick={() => setEditingAgent(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
              </div>
            </div>
            <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-600 font-medium block mb-1">年龄</label>
                  <input type="text" inputMode="numeric" value={editingAgent.age || ''} onChange={e => { const val = e.target.value.replace(/^0+/, ''); setEditingAgent({...editingAgent, age: val === '' ? 0 : parseInt(val) || 0}) }} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800" placeholder="25" />
                </div>
                <div>
                  <label className="text-xs text-gray-600 font-medium block mb-1">性别</label>
                  <select value={editingAgent.gender} onChange={e => setEditingAgent({...editingAgent, gender: e.target.value})} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800">
                    <option value="男">男</option>
                    <option value="女">女</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-600 font-medium block mb-1">地区</label>
                  <input type="text" value={editingAgent.location} onChange={e => setEditingAgent({...editingAgent, location: e.target.value})} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800" placeholder="中国" />
                </div>
                <div>
                  <label className="text-xs text-gray-600 font-medium block mb-1">MBTI</label>
                  <select value={editingAgent.mbti || ''} onChange={e => setEditingAgent({...editingAgent, mbti: e.target.value})} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800">
                    <option value="">选择...</option>
                    <option value="INTJ">INTJ - 建筑师</option>
                    <option value="INTP">INTP - 逻辑学家</option>
                    <option value="ENTJ">ENTJ - 指挥官</option>
                    <option value="ENTP">ENTP - 辩论家</option>
                    <option value="INFJ">INFJ - 提倡者</option>
                    <option value="INFP">INFP - 调停者</option>
                    <option value="ENFJ">ENFJ - 主人公</option>
                    <option value="ENFP">ENFP - 竞选者</option>
                    <option value="ISTJ">ISTJ - 物流师</option>
                    <option value="ISFJ">ISFJ - 守卫者</option>
                    <option value="ESTJ">ESTJ - 总经理</option>
                    <option value="ESFJ">ESFJ - 执政官</option>
                    <option value="ISTP">ISTP - 鉴赏家</option>
                    <option value="ISFP">ISFP - 探险家</option>
                    <option value="ESTP">ESTP - 企业家</option>
                    <option value="ESFP">ESFP - 表演者</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-600 font-medium block mb-1">个人简介</label>
                <textarea value={editingAgent.bio} onChange={e => setEditingAgent({...editingAgent, bio: e.target.value})} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 h-24 resize-none" placeholder="描述这个角色的背景和特点..." />
              </div>
              <div>
                <label className="text-xs text-gray-600 font-medium block mb-1">标签 (逗号分隔)</label>
                <input type="text" value={editingAgent.tags.join(', ')} onChange={e => setEditingAgent({...editingAgent, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)})} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800" placeholder="FOMO, 追涨杀跌, 短线交易" />
              </div>
              <div>
                <label className="text-xs text-gray-600 font-medium block mb-1">行为模式</label>
                <input type="text" value={editingAgent.background.behavior} onChange={e => setEditingAgent({...editingAgent, background: {...editingAgent.background, behavior: e.target.value}})} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800" placeholder="描述决策风格和行为特点..." />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
