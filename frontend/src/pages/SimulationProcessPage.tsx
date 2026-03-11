import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Check, Circle, RefreshCw, ChevronRight } from 'lucide-react'
import ForceGraph2D from 'react-force-graph-2d'

// 步骤状态
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
  time_slots: {
    name: string
    range: string
    coefficient: number
  }[]
}

// 颜色配置
const typeColors: Record<string, string> = {
  '散户': '#F85149',
  '机构': '#3FB950',
  '巨鲸': '#58A6FF',
  '分析师': '#A371F7',
  'KOL': '#D29922',
  'University': '#F85149',
  'Student': '#8B949E',
  'Professor': '#A371F7',
  'MediaOutlet': '#D29922',
  'Organization': '#3FB950',
  'default': '#8B949E'
}

export default function SimulationProcessPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const graphRef = useRef<any>()
  
  // 步骤状态 - 全部完成
  const [steps] = useState<Step[]>([
    { id: 1, title: '模拟实例初始化', description: '新建 simulation 实例，拉取模拟世界参数模版', status: 'completed' },
    { id: 2, title: '生成 Agent 人设', description: '结合上下文与现实种子当前关联话题数，为每个实体生成完整的 Agent 人设', status: 'completed' },
    { id: 3, title: '生成模拟配置', description: 'LLM 根据模拟需求与 Agent 人设，生成双平台模拟配置参数', status: 'completed' },
    { id: 4, title: '初始激活编排', description: '基于叙事方向与 Agent 人设，编排初始激活序列', status: 'completed' },
    { id: 5, title: '准备完成', description: '模拟环境已准备完成，可以开始运行模拟', status: 'running' },
  ])
  
  const currentStep = 5
  
  const [agents] = useState<AgentPersona[]>([
    {
      id: 'retail_001',
      name: '散户小白_001',
      type: '散户',
      age: 25,
      gender: '男',
      mbti: 'ESFP',
      location: '中国',
      bio: '刚入币圈的新人程序员，听说炒币能暴富就进来了。喜欢看 KOL 推荐，容易 FOMO，追涨杀跌。',
      tags: ['FOMO', '追涨杀跌', 'KOL跟单', '短线交易'],
      background: {
        experience: '在此事件中的完整行为轨迹',
        behavior: '将他总结与行事风格偏好',
        memory: '围绕种子形成的记忆',
        socialNetwork: '个体链接与交互图谱'
      }
    },
    {
      id: 'whale_001',
      name: '巨鲸OG_001',
      type: '巨鲸',
      age: 45,
      gender: '男',
      mbti: 'INTJ',
      location: '美国',
      bio: '2013年开始接触 BTC 的 OG，经历过多轮牛熊。喜欢在别人恐慌时抄底，逆向投资思维。',
      tags: ['逆向投资', '长期持有', '底部抄底', '信息灵通'],
      background: {
        experience: '多轮牛熊周期的完整经历',
        behavior: '逆向思维，耐心等待',
        memory: '2017年牛市、2020年DeFi夏天',
        socialNetwork: '与多家机构有联系'
      }
    },
    {
      id: 'inst_001',
      name: '机构交易员_001',
      type: '机构',
      age: 35,
      gender: '男',
      mbti: 'ENTJ',
      location: '新加坡',
      bio: '某加密基金首席交易员，管理着数亿美元规模的仓位。注重风控，使用量化策略。',
      tags: ['量化交易', '风险控制', '大资金', '合规'],
      background: {
        experience: '传统金融背景，转型加密',
        behavior: '理性、数据驱动',
        memory: 'FTX 事件后更注重安全',
        socialNetwork: '与多家交易所和托管方联系'
      }
    },
    {
      id: 'analyst_001',
      name: '链上分析师_001',
      type: '分析师',
      age: 30,
      gender: '女',
      mbti: 'INTP',
      location: '香港',
      bio: '专注链上数据分析，擅长从巨鲸动向和交易所流入流出预测市场走势。',
      tags: ['链上分析', '数据驱动', '技术派', '深度研究'],
      background: {
        experience: '数据科学背景',
        behavior: '客观、重视证据',
        memory: '多次成功预测大行情',
        socialNetwork: '在 Twitter 有大量粉丝'
      }
    },
    {
      id: 'kol_001',
      name: 'CryptoKOL_001',
      type: 'KOL',
      age: 28,
      gender: '男',
      mbti: 'ENFP',
      location: '迪拜',
      bio: 'Twitter 50万粉丝的加密 KOL，擅长带节奏和制造 FOMO。经常喊单，有时候准有时候不准。',
      tags: ['带货', 'FOMO制造', '喊单', '流量'],
      background: {
        experience: '从小博主成长起来',
        behavior: '夸张、煽动性',
        memory: '靠 meme 币起家',
        socialNetwork: '与项目方有利益关系'
      }
    },
  ])
  
  const [selectedAgent, setSelectedAgent] = useState<AgentPersona | null>(null)
  
  const [config] = useState<SimConfig>({
    duration_hours: 72,
    rounds_per_hour: 60,
    total_rounds: 72,
    time_per_round: '10-27',
    time_slots: [
      { name: '高峰时段', range: '19:00, 20:00, 21:00, 22:00', coefficient: 1.5 },
      { name: '工作时段', range: '9:00-18:00', coefficient: 0.7 },
      { name: '早间时段', range: '6:00-8:00', coefficient: 0.4 },
      { name: '低谷时段', range: '0:00-5:00', coefficient: 0.05 },
    ]
  })
  
  const [narrative] = useState({
    direction: '市场对该事件的反应将分化：一部分交易者认为这是利好信号，另一部分则担忧潜在风险。舆论将围绕事件影响和后续发展展开讨论。',
    topics: ['BTC', 'ETF', '美联储', '降息', '市场情绪'],
    initialSequence: [
      { type: 'WHALE', agentId: '巨鲸OG_001', content: '巨鲸开始建仓，市场暗流涌动。' },
      { type: 'ANALYST', agentId: '链上分析师_001', content: '分析师发布研报，指出技术面支撑位。' },
      { type: 'KOL', agentId: 'CryptoKOL_001', content: 'KOL 转发分析，引发社区讨论。' },
      { type: 'RETAIL', agentId: '散户小白_001', content: '散户开始关注，FOMO 情绪升温。' },
    ]
  })
  
  const [logs] = useState<string[]>([
    '15:18:30.955  ├─ Agent数量：5个',
    '15:18:30.955  ├─ 模拟时长：72小时',
    '15:18:30.955  ├─ 初始帖子：4条',
    '15:18:30.955  ✓ 环境搭建完成，可以开始模拟',
  ])
  
  const logRef = useRef<HTMLDivElement>(null)
  
  // 图谱数据 - 更丰富的网络
  const graphData = {
    nodes: [
      // 主要 agents
      ...agents.map(a => ({
        id: a.id,
        name: a.name,
        type: a.type,
        val: a.type === '巨鲸' ? 40 : a.type === '机构' ? 30 : a.type === 'KOL' || a.type === '分析师' ? 20 : 15,
        color: typeColors[a.type] || typeColors.default
      })),
      // 额外实体节点
      { id: 'btc', name: 'BTC', type: 'Entity', val: 50, color: '#F7931A' },
      { id: 'eth', name: 'ETH', type: 'Entity', val: 40, color: '#627EEA' },
      { id: 'twitter', name: 'Twitter', type: 'Platform', val: 35, color: '#1DA1F2' },
      { id: 'exchange', name: '交易所', type: 'Organization', val: 30, color: '#3FB950' },
      { id: 'news', name: '财经媒体', type: 'MediaOutlet', val: 25, color: '#D29922' },
    ],
    links: [
      // Agent 之间的关系
      { source: 'whale_001', target: 'btc' },
      { source: 'whale_001', target: 'eth' },
      { source: 'whale_001', target: 'exchange' },
      { source: 'inst_001', target: 'btc' },
      { source: 'inst_001', target: 'exchange' },
      { source: 'analyst_001', target: 'twitter' },
      { source: 'analyst_001', target: 'btc' },
      { source: 'analyst_001', target: 'eth' },
      { source: 'kol_001', target: 'twitter' },
      { source: 'kol_001', target: 'retail_001' },
      { source: 'retail_001', target: 'twitter' },
      { source: 'retail_001', target: 'exchange' },
      { source: 'news', target: 'twitter' },
      { source: 'news', target: 'analyst_001' },
      { source: 'exchange', target: 'btc' },
      { source: 'exchange', target: 'eth' },
    ]
  }
  
  const StepIndicator = ({ step }: { step: Step }) => (
    <div className={`flex items-start gap-3 p-4 rounded-lg border transition-all ${
      step.status === 'completed' ? 'bg-accent-blue/10 border-accent-blue/50' :
      step.status === 'running' ? 'bg-card-bg border-accent-blue' :
      'bg-card-bg border-border'
    }`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
        step.status === 'completed' ? 'bg-accent-green text-white' :
        step.status === 'running' ? 'bg-accent-blue text-white' :
        'bg-border text-text-secondary'
      }`}>
        {step.status === 'completed' ? <Check size={16} /> : step.id.toString().padStart(2, '0')}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{step.title}</h3>
          <span className={`text-xs px-2 py-1 rounded ${
            step.status === 'completed' ? 'bg-accent-green/20 text-accent-green' :
            step.status === 'running' ? 'bg-accent-blue/20 text-accent-blue' :
            'bg-border text-text-secondary'
          }`}>
            {step.status === 'completed' ? '已完成' : step.status === 'running' ? '进行中' : '待执行'}
          </span>
        </div>
        <p className="text-sm text-text-secondary mt-1">{step.description}</p>
      </div>
    </div>
  )
  
  const AgentCard = ({ agent, onClick }: { agent: AgentPersona; onClick: () => void }) => (
    <div 
      className="bg-dark-bg rounded-lg p-4 border border-border hover:border-accent-blue cursor-pointer transition-all"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold">{agent.name}</span>
        <span className="text-xs text-text-secondary">@{agent.type}</span>
      </div>
      <div className="text-sm text-text-secondary mb-2">
        <span className="px-2 py-0.5 rounded text-xs" style={{ 
          backgroundColor: `${typeColors[agent.type]}20`,
          color: typeColors[agent.type]
        }}>{agent.type}</span>
      </div>
      <p className="text-sm text-text-secondary line-clamp-2">{agent.bio}</p>
      <div className="flex flex-wrap gap-1 mt-2">
        {agent.tags.slice(0, 3).map(tag => (
          <span key={tag} className="text-xs text-accent-blue bg-accent-blue/10 px-2 py-0.5 rounded">
            {tag}
          </span>
        ))}
        {agent.tags.length > 3 && (
          <span className="text-xs text-text-secondary">+{agent.tags.length - 3}</span>
        )}
      </div>
    </div>
  )
  
  return (
    <div className="h-screen flex flex-col bg-dark-bg">
      {/* Header - 简化版 */}
      <header className="border-b border-border bg-card-bg px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-text-secondary hover:text-text-primary text-xl">
            ←
          </button>
          <h1 className="text-xl font-bold bg-gradient-to-r from-accent-blue to-accent-purple bg-clip-text text-transparent">
            QuantWorld
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-text-secondary">Step {currentStep}/5 环境搭建</span>
          <span className="flex items-center gap-1 text-accent-green text-sm">
            <Circle size={8} className="fill-accent-green" /> 就绪
          </span>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Graph - MiroFish 风格 */}
        <div className="w-1/2 p-4 border-r border-border">
          <div className="h-full bg-gradient-to-br from-[#0d1117] to-[#161b22] rounded-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <h2 className="font-semibold text-lg">Graph Relationship Visualization</h2>
              <button className="text-sm text-text-secondary hover:text-text-primary flex items-center gap-1">
                <RefreshCw size={14} /> Refresh
              </button>
            </div>
            <div className="h-[calc(100%-60px)] relative">
              <ForceGraph2D
                ref={graphRef}
                graphData={graphData}
                nodeLabel="name"
                nodeColor={(node: any) => node.color}
                nodeVal={(node: any) => node.val}
                linkColor={() => 'rgba(88, 166, 255, 0.2)'}
                linkWidth={1}
                backgroundColor="transparent"
                nodeCanvasObject={(node: any, ctx, globalScale) => {
                  const label = node.name
                  const fontSize = Math.max(10 / globalScale, 3)
                  const nodeSize = Math.sqrt(node.val) * 2
                  
                  // 绘制节点
                  ctx.beginPath()
                  ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI)
                  ctx.fillStyle = node.color
                  ctx.fill()
                  
                  // 绘制光晕效果
                  ctx.beginPath()
                  ctx.arc(node.x, node.y, nodeSize + 2, 0, 2 * Math.PI)
                  ctx.strokeStyle = `${node.color}40`
                  ctx.lineWidth = 2
                  ctx.stroke()
                  
                  // 绘制标签
                  ctx.font = `${fontSize}px Sans-Serif`
                  ctx.textAlign = 'center'
                  ctx.textBaseline = 'middle'
                  ctx.fillStyle = '#e6edf3'
                  ctx.fillText(label, node.x, node.y + nodeSize + fontSize + 2)
                }}
                cooldownTicks={100}
                onNodeClick={(node: any) => {
                  const agent = agents.find(a => a.id === node.id)
                  if (agent) setSelectedAgent(agent)
                }}
              />
              
              {/* 图例 */}
              <div className="absolute bottom-4 left-4 bg-card-bg/90 backdrop-blur rounded-lg p-3 border border-border">
                <div className="text-xs text-text-secondary mb-2 font-semibold">ENTITY TYPES</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  {Object.entries(typeColors).filter(([k]) => k !== 'default').slice(0, 8).map(([type, color]) => (
                    <div key={type} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-text-secondary">{type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right: Steps & Config */}
        <div className="w-1/2 flex flex-col overflow-hidden">
          {/* Steps Panel */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* 显示所有步骤 */}
            {steps.slice(0, 2).map(step => (
              <StepIndicator key={step.id} step={step} />
            ))}
            
            {/* Step 2 Content: Agents */}
            <div className="bg-card-bg rounded-lg border border-border p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-accent-blue">{agents.length}</div>
                    <div className="text-xs text-text-secondary">当前AGENT数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">{agents.length}</div>
                    <div className="text-xs text-text-secondary">预期AGENT总数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-accent-purple">15</div>
                    <div className="text-xs text-text-secondary">关联话题数</div>
                  </div>
                </div>
              </div>
              
              <h4 className="text-sm text-text-secondary mb-2">已生成的 AGENT 人设</h4>
              <div className="grid grid-cols-2 gap-3">
                {agents.map(agent => (
                  <AgentCard key={agent.id} agent={agent} onClick={() => setSelectedAgent(agent)} />
                ))}
              </div>
            </div>
            
            {/* Step 3: Config */}
            <StepIndicator step={steps[2]} />
            <div className="bg-card-bg rounded-lg border border-border p-4">
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="bg-dark-bg rounded-lg p-3">
                  <div className="text-xs text-text-secondary">模拟时长</div>
                  <div className="text-2xl font-bold">{config.duration_hours} <span className="text-sm font-normal">小时</span></div>
                </div>
                <div className="bg-dark-bg rounded-lg p-3">
                  <div className="text-xs text-text-secondary">每轮时长</div>
                  <div className="text-2xl font-bold">{config.rounds_per_hour} <span className="text-sm font-normal">分钟</span></div>
                </div>
                <div className="bg-dark-bg rounded-lg p-3">
                  <div className="text-xs text-text-secondary">总轮次</div>
                  <div className="text-2xl font-bold">{config.total_rounds} <span className="text-sm font-normal">轮</span></div>
                </div>
                <div className="bg-dark-bg rounded-lg p-3">
                  <div className="text-xs text-text-secondary">每小时活跃</div>
                  <div className="text-2xl font-bold">{config.time_per_round}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                {config.time_slots.map(slot => (
                  <div key={slot.name} className="flex items-center justify-between text-sm bg-dark-bg/50 rounded px-3 py-2">
                    <span className="text-text-secondary">{slot.name}</span>
                    <span>{slot.range}</span>
                    <span className={`font-mono ${slot.coefficient > 1 ? 'text-accent-green' : slot.coefficient < 0.5 ? 'text-accent-red' : 'text-text-secondary'}`}>
                      x{slot.coefficient}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Step 4: Narrative */}
            <StepIndicator step={steps[3]} />
            <div className="bg-card-bg rounded-lg border border-border p-4">
              <div className="mb-4">
                <h4 className="text-sm text-text-secondary mb-2">叙事引导方向</h4>
                <p className="text-sm bg-dark-bg rounded-lg p-3 border-l-2 border-accent-blue">{narrative.direction}</p>
              </div>
              
              <div className="mb-4">
                <h4 className="text-sm text-text-secondary mb-2">初始热点话题</h4>
                <div className="flex flex-wrap gap-2">
                  {narrative.topics.map(topic => (
                    <span key={topic} className="text-sm text-accent-red bg-accent-red/10 px-3 py-1 rounded">
                      #{topic}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm text-text-secondary mb-2">初始激活序列 ({narrative.initialSequence.length})</h4>
                <div className="space-y-2">
                  {narrative.initialSequence.map((seq, i) => (
                    <div key={i} className="bg-dark-bg rounded-lg p-3 flex items-start gap-3">
                      <span className="text-xs font-semibold bg-accent-blue/20 text-accent-blue px-2 py-1 rounded">{seq.type}</span>
                      <div className="flex-1">
                        <span className="text-xs text-text-secondary">Agent: {seq.agentId}</span>
                        <p className="text-sm mt-1">{seq.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Step 5: Ready */}
            <StepIndicator step={steps[4]} />
            <div className="bg-gradient-to-br from-accent-blue/10 to-accent-purple/10 rounded-lg border border-accent-blue/50 p-6">
              <div className="text-center mb-6">
                <div className="text-5xl font-bold bg-gradient-to-r from-accent-blue to-accent-purple bg-clip-text text-transparent mb-2">
                  {Math.floor(config.duration_hours * 60 / config.rounds_per_hour)} <span className="text-lg font-normal text-text-secondary">轮</span>
                </div>
                <p className="text-sm text-text-secondary">
                  若首次运行，强烈建议减少模拟轮数，以便快速预览效果并降低报错风险
                </p>
              </div>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => navigate(-1)}
                  className="flex-1 py-3 rounded-lg border border-border text-text-secondary hover:border-accent-blue transition"
                >
                  ← 返回图谱构建
                </button>
                <button 
                  className="flex-1 py-3 rounded-lg bg-gradient-to-r from-accent-blue to-accent-purple text-white font-semibold hover:opacity-90 transition flex items-center justify-center gap-2"
                  onClick={() => navigate(`/simulation/${id}`)}
                >
                  启动双平台模拟
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
          
          {/* Bottom: System Log */}
          <div className="h-28 bg-[#0d1117] border-t border-border">
            <div className="px-4 py-2 border-b border-border/50 flex items-center justify-between">
              <span className="text-xs text-text-secondary font-mono">SYSTEM DASHBOARD</span>
              <span className="text-xs text-text-secondary font-mono">sim_{id?.slice(0, 12) || 'default'}</span>
            </div>
            <div ref={logRef} className="h-20 overflow-y-auto p-2 font-mono text-xs text-accent-green">
              {logs.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Agent Detail Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setSelectedAgent(null)}>
          <div className="bg-card-bg rounded-xl w-[500px] max-h-[80vh] overflow-y-auto border border-border" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{selectedAgent.name}</h2>
                <span className="text-sm px-2 py-0.5 rounded" style={{ 
                  backgroundColor: `${typeColors[selectedAgent.type]}20`,
                  color: typeColors[selectedAgent.type]
                }}>@{selectedAgent.type}</span>
              </div>
              <button onClick={() => setSelectedAgent(null)} className="text-text-secondary hover:text-text-primary text-2xl">×</button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-dark-bg rounded-lg p-3">
                  <div className="text-xs text-text-secondary">表观年龄</div>
                  <div className="text-lg font-semibold">{selectedAgent.age} 岁</div>
                </div>
                <div className="bg-dark-bg rounded-lg p-3">
                  <div className="text-xs text-text-secondary">表观性别</div>
                  <div className="text-lg font-semibold">{selectedAgent.gender === '男' ? '男性' : selectedAgent.gender === '女' ? '女性' : '其他'}</div>
                </div>
                <div className="bg-dark-bg rounded-lg p-3">
                  <div className="text-xs text-text-secondary">国家/地区</div>
                  <div className="text-lg font-semibold">{selectedAgent.location}</div>
                </div>
                <div className="bg-dark-bg rounded-lg p-3">
                  <div className="text-xs text-text-secondary">表观 MBTI</div>
                  <div className="text-lg font-semibold text-accent-green">{selectedAgent.mbti || 'N/A'}</div>
                </div>
              </div>
              
              <div>
                <div className="text-xs text-text-secondary mb-2">个人简介</div>
                <p className="bg-dark-bg rounded-lg p-3 text-sm">{selectedAgent.bio}</p>
              </div>
              
              <div>
                <div className="text-xs text-text-secondary mb-2">关注话题</div>
                <div className="flex flex-wrap gap-2">
                  {selectedAgent.tags.map(tag => (
                    <span key={tag} className="text-sm text-accent-blue bg-accent-blue/10 px-3 py-1 rounded">{tag}</span>
                  ))}
                </div>
              </div>
              
              <div>
                <div className="text-xs text-text-secondary mb-2">详细人设背景</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-dark-bg rounded-lg p-3">
                    <div className="text-sm font-semibold mb-1">事件全景经历</div>
                    <div className="text-xs text-text-secondary">{selectedAgent.background.experience}</div>
                  </div>
                  <div className="bg-dark-bg rounded-lg p-3">
                    <div className="text-sm font-semibold mb-1">行为模式简写</div>
                    <div className="text-xs text-text-secondary">{selectedAgent.background.behavior}</div>
                  </div>
                  <div className="bg-dark-bg rounded-lg p-3">
                    <div className="text-sm font-semibold mb-1">独特记忆印记</div>
                    <div className="text-xs text-text-secondary">{selectedAgent.background.memory}</div>
                  </div>
                  <div className="bg-dark-bg rounded-lg p-3">
                    <div className="text-sm font-semibold mb-1">社会关系网络</div>
                    <div className="text-xs text-text-secondary">{selectedAgent.background.socialNetwork}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
