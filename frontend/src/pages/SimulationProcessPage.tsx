import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Check, Circle, RefreshCw, 
  ChevronRight
} from 'lucide-react'
import AgentGraph from '../components/AgentGraph'

// 步骤状态
type StepStatus = 'pending' | 'running' | 'completed'

interface Step {
  id: number
  title: string
  description: string
  status: StepStatus
  apiEndpoint?: string
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

export default function SimulationProcessPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [currentStep] = useState(1)
  const [steps] = useState<Step[]>([
    { id: 1, title: '模拟实例初始化', description: '新建 simulation 实例，拉取模拟世界参数模版', status: 'completed' },
    { id: 2, title: '生成 Agent 人设', description: '结合上下文与现实种子当前关联话题数，为每个实体生成完整的 Agent 人设', status: 'running' },
    { id: 3, title: '生成模拟配置', description: 'LLM 根据模拟需求与 Agent 人设，生成双平台模拟配置参数', status: 'pending' },
    { id: 4, title: '初始激活编排', description: '基于叙事方向与 Agent 人设，编排初始激活序列', status: 'pending' },
    { id: 5, title: '准备完成', description: '模拟环境已准备完成，可以开始运行模拟', status: 'pending' },
  ])
  
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
    direction: '公众对某事件的反应将分化，一部分人认为这是对公正的维护，另一部分人则可能认为是在回应公众压力。',
    topics: ['BTC', 'ETF', '美联储', '降息', '市场情绪'],
    initialSequence: [
      { type: 'WHALE', agentId: 'whale_001', content: '巨鲸开始建仓，市场暗流涌动。' },
      { type: 'ANALYST', agentId: 'analyst_001', content: '分析师发布研报，指出技术面支撑位。' },
      { type: 'KOL', agentId: 'kol_001', content: 'KOL 转发分析，引发社区讨论。' },
      { type: 'RETAIL', agentId: 'retail_001', content: '散户开始关注，FOMO 情绪升温。' },
    ]
  })
  
  const [logs] = useState<string[]>([
    '15:18:30.955  ├─ Agent数量：55个',
    '15:18:30.955  ├─ 模拟时长：72小时',
    '15:18:30.955  ├─ 初始帖子：4条',
    '15:18:30.955  ✓ 环境搭建完成，可以开始模拟',
  ])
  
  const logRef = useRef<HTMLDivElement>(null)
  
  // 图谱数据
  const graphNodes = agents.map((a) => ({
    id: a.id,
    label: a.name.slice(0, 8),
    group: a.type,
    color: a.type === '散户' ? '#F85149' : a.type === '巨鲸' ? '#58A6FF' : a.type === '机构' ? '#3FB950' : '#D29922',
    size: a.type === '散户' ? 10 : a.type === '巨鲸' ? 30 : 20
  }))
  
  const graphEdges = [
    { from: 'whale_001', to: 'retail_001' },
  ]
  
  const StepIndicator = ({ step }: { step: Step }) => (
    <div className={`flex items-start gap-3 p-4 rounded-lg border transition-all ${
      step.status === 'completed' ? 'bg-accent-blue/10 border-accent-blue' :
      step.status === 'running' ? 'bg-card-bg border-accent-blue animate-pulse' :
      'bg-card-bg border-border'
    }`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
        step.status === 'completed' ? 'bg-accent-blue text-white' :
        step.status === 'running' ? 'bg-accent-blue/20 text-accent-blue' :
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
        <span className="bg-card-bg px-2 py-0.5 rounded mr-2">{agent.type}</span>
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
      {/* Header */}
      <header className="border-b border-border bg-card-bg px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-text-secondary hover:text-text-primary">
            ←
          </button>
          <h1 className="text-xl font-bold">QuantWorld</h1>
          <div className="flex gap-2">
            <button className="px-3 py-1 rounded bg-card-bg border border-border text-sm">图谱</button>
            <button className="px-3 py-1 rounded bg-card-bg border border-border text-sm">双栏</button>
            <button className="px-3 py-1 rounded bg-card-bg border border-border text-sm">工作台</button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm">Step {currentStep}/5 环境搭建</span>
          <span className="flex items-center gap-1 text-accent-green text-sm">
            <Circle size={8} className="fill-accent-green" /> 就绪
          </span>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Graph */}
        <div className="w-1/2 p-4 border-r border-border">
          <div className="h-full bg-card-bg rounded-xl border border-border">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold">Graph Relationship Visualization</h2>
              <div className="flex items-center gap-2">
                <button className="text-sm text-text-secondary hover:text-text-primary flex items-center gap-1">
                  <RefreshCw size={14} /> Refresh
                </button>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="accent-accent-blue" defaultChecked />
                  Show Edge Labels
                </label>
              </div>
            </div>
            <div className="h-[calc(100%-60px)]">
              <AgentGraph nodes={graphNodes} edges={graphEdges} height={600} />
            </div>
          </div>
        </div>
        
        {/* Right: Steps & Config */}
        <div className="w-1/2 flex flex-col overflow-hidden">
          {/* Steps Panel */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Step 1 & 2 */}
            {steps.slice(0, 2).map(step => (
              <StepIndicator key={step.id} step={step} />
            ))}
            
            {/* Step 2 Content: Agents */}
            {currentStep >= 2 && (
              <div className="bg-card-bg rounded-lg border border-border p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <div className="text-3xl font-bold">{agents.length}</div>
                      <div className="text-xs text-text-secondary">当前AGENT数</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold">{agents.length}</div>
                      <div className="text-xs text-text-secondary">预期AGENT总数</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold">272</div>
                      <div className="text-xs text-text-secondary">现实种子当前关联话题数</div>
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
            )}
            
            {/* Step 3: Config */}
            {currentStep >= 3 && (
              <>
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
                      <div key={slot.name} className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary">{slot.name}</span>
                        <span>{slot.range}</span>
                        <span className={slot.coefficient > 1 ? 'text-accent-green' : 'text-text-secondary'}>
                          x{slot.coefficient}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            {/* Step 4: Narrative */}
            {currentStep >= 4 && (
              <>
                <StepIndicator step={steps[3]} />
                <div className="bg-card-bg rounded-lg border border-border p-4">
                  <div className="mb-4">
                    <h4 className="text-sm text-text-secondary mb-2">叙事引导方向</h4>
                    <p className="text-sm bg-dark-bg rounded-lg p-3">{narrative.direction}</p>
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
                        <div key={i} className="bg-dark-bg rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold">{seq.type}</span>
                            <span className="text-xs text-text-secondary">{seq.agentId}</span>
                          </div>
                          <p className="text-sm text-text-secondary">{seq.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
            
            {/* Step 5: Ready */}
            {currentStep >= 5 && (
              <>
                <StepIndicator step={steps[4]} />
                <div className="bg-card-bg rounded-lg border border-accent-blue p-4">
                  <div className="text-center mb-4">
                    <div className="text-5xl font-bold text-accent-blue mb-2">40 <span className="text-lg font-normal">轮</span></div>
                    <p className="text-sm text-text-secondary">
                      若首次运行，强烈建议切换至"自定义模式"减少模拟轮数，以便快速预览效果并降低报错风险 →
                    </p>
                  </div>
                  
                  <div className="flex gap-4">
                    <button className="flex-1 py-3 rounded-lg border border-border text-text-secondary hover:border-accent-blue transition">
                      ← 返回图谱构建
                    </button>
                    <button 
                      className="flex-1 py-3 rounded-lg bg-accent-blue text-white font-semibold hover:bg-accent-blue/80 transition flex items-center justify-center gap-2"
                      onClick={() => navigate(`/simulation/${id}`)}
                    >
                      启动双平台模拟
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* Bottom: System Log */}
          <div className="h-32 bg-[#1a1a2e] border-t border-border">
            <div className="px-4 py-2 border-b border-border flex items-center justify-between">
              <span className="text-xs text-text-secondary">SYSTEM DASHBOARD</span>
              <span className="text-xs text-text-secondary">sim_{id?.slice(0, 12)}</span>
            </div>
            <div ref={logRef} className="h-24 overflow-y-auto p-2 font-mono text-xs text-text-secondary">
              {logs.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Agent Detail Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedAgent(null)}>
          <div className="bg-card-bg rounded-xl w-[500px] max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{selectedAgent.name}</h2>
                <span className="text-sm text-text-secondary">@{selectedAgent.type}</span>
              </div>
              <button onClick={() => setSelectedAgent(null)} className="text-text-secondary hover:text-text-primary">×</button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-text-secondary">表观年龄</div>
                  <div className="text-lg font-semibold">{selectedAgent.age} 岁</div>
                </div>
                <div>
                  <div className="text-xs text-text-secondary">表观性别</div>
                  <div className="text-lg font-semibold">{selectedAgent.gender === '男' ? '男性' : '女性'}</div>
                </div>
                <div>
                  <div className="text-xs text-text-secondary">国家/地区</div>
                  <div className="text-lg font-semibold">{selectedAgent.location}</div>
                </div>
                <div>
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
