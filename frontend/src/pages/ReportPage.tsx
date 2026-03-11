import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Download, FileText, TrendingUp, Users, Brain, Network } from 'lucide-react'
import { FearGreedGauge, FundFlowChart, AgentSentimentPie, PositionChart } from '../components/Charts'
import AgentGraph from '../components/AgentGraph'

interface SimulationReport {
  id: string
  name: string
  duration_hours: number
  total_ticks: number
  agents: {
    total: number
    by_type: { [key: string]: number }
  }
  actions: {
    total: number
    buys: number
    sells: number
  }
  market_summary: {
    start_fear_greed: number
    end_fear_greed: number
    avg_fear_greed: number
  }
  narrative: { content: string; timestamp: string; agent_id?: string }[]
}

export default function ReportPage() {
  const { id } = useParams()
  const [report, setReport] = useState<SimulationReport | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // 模拟加载报告数据
    setTimeout(() => {
      setReport({
        id: id || 'sim_demo',
        name: '7天市场仿真',
        duration_hours: 168,
        total_ticks: 168,
        agents: {
          total: 63,
          by_type: {
            retail_trader: 50,
            institutional_trader: 10,
            whale_trader: 3
          }
        },
        actions: {
          total: 420,
          buys: 230,
          sells: 190
        },
        market_summary: {
          start_fear_greed: 45,
          end_fear_greed: 62,
          avg_fear_greed: 53
        },
        narrative: [
          { content: '巨鲸大额买入 BTC', timestamp: '2026-03-11T08:00:00', agent_id: 'whale_1' },
          { content: '分析师发布看多报告', timestamp: '2026-03-11T10:00:00', agent_id: 'analyst_1' },
          { content: '散户 FOMO 跟进', timestamp: '2026-03-11T12:00:00' },
          { content: 'KOL 喊单引发买入潮', timestamp: '2026-03-12T09:00:00', agent_id: 'kol_1' },
          { content: '资金费率过高，机构减仓', timestamp: '2026-03-13T14:00:00' },
        ]
      })
      setLoading(false)
    }, 1000)
  }, [id])
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue" />
      </div>
    )
  }
  
  if (!report) {
    return <div>报告未找到</div>
  }
  
  const sentimentData = [
    { type: 'retail', bullish: 30, bearish: 15, neutral: 5 },
    { type: 'institutional', bullish: 5, bearish: 3, neutral: 2 },
    { type: 'whale', bullish: 2, bearish: 1, neutral: 0 }
  ]
  
  const graphNodes = [
    { id: 'whale_1', label: 'Whale', group: 'whale_trader', color: '#58A6FF', size: 30 },
    { id: 'analyst_1', label: 'Analyst', group: 'analyst', color: '#A371F7', size: 20 },
    { id: 'kol_1', label: 'KOL', group: 'kol', color: '#D29922', size: 20 },
    { id: 'inst_1', label: 'Inst_1', group: 'institutional_trader', color: '#3FB950', size: 15 },
    { id: 'inst_2', label: 'Inst_2', group: 'institutional_trader', color: '#3FB950', size: 15 },
    { id: 'retail_1', label: 'R1', group: 'retail_trader', color: '#F85149', size: 8 },
    { id: 'retail_2', label: 'R2', group: 'retail_trader', color: '#F85149', size: 8 },
    { id: 'retail_3', label: 'R3', group: 'retail_trader', color: '#F85149', size: 8 },
  ]
  
  const graphEdges = [
    { from: 'whale_1', to: 'inst_1' },
    { from: 'whale_1', to: 'inst_2' },
    { from: 'analyst_1', to: 'retail_1' },
    { from: 'analyst_1', to: 'retail_2' },
    { from: 'kol_1', to: 'retail_2' },
    { from: 'kol_1', to: 'retail_3' },
    { from: 'inst_1', to: 'retail_1' },
  ]
  
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="text-accent-blue" />
            仿真报告
          </h1>
          <p className="text-text-secondary text-sm">{report.name} | ID: {report.id}</p>
        </div>
        
        <button className="px-4 py-2 bg-accent-blue text-white rounded-lg flex items-center gap-2 hover:bg-accent-blue/80">
          <Download size={18} />
          导出 PDF
        </button>
      </div>
      
      {/* 概览卡片 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-card-bg border border-border rounded-xl p-4">
          <div className="text-text-secondary text-sm mb-1">仿真时长</div>
          <div className="text-2xl font-bold">{report.duration_hours}h</div>
          <div className="text-xs text-text-secondary">{report.total_ticks} 个时间步</div>
        </div>
        
        <div className="bg-card-bg border border-border rounded-xl p-4">
          <div className="text-text-secondary text-sm mb-1 flex items-center gap-1">
            <Users size={14} /> 智能体
          </div>
          <div className="text-2xl font-bold">{report.agents.total}</div>
          <div className="text-xs text-text-secondary">
            散户 {report.agents.by_type.retail_trader} | 
            机构 {report.agents.by_type.institutional_trader} | 
            巨鲸 {report.agents.by_type.whale_trader}
          </div>
        </div>
        
        <div className="bg-card-bg border border-border rounded-xl p-4">
          <div className="text-text-secondary text-sm mb-1 flex items-center gap-1">
            <TrendingUp size={14} /> 交易动作
          </div>
          <div className="text-2xl font-bold">{report.actions.total}</div>
          <div className="text-xs">
            <span className="text-accent-green">买入 {report.actions.buys}</span> | 
            <span className="text-accent-red ml-1">卖出 {report.actions.sells}</span>
          </div>
        </div>
        
        <div className="bg-card-bg border border-border rounded-xl p-4">
          <div className="text-text-secondary text-sm mb-1 flex items-center gap-1">
            <Brain size={14} /> 平均情绪
          </div>
          <div className="text-2xl font-bold">{report.market_summary.avg_fear_greed}</div>
          <div className="text-xs text-text-secondary">
            起始 {report.market_summary.start_fear_greed} → 
            结束 {report.market_summary.end_fear_greed}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        {/* 左侧 */}
        <div className="space-y-6">
          {/* 情绪分布 */}
          <div className="bg-card-bg border border-border rounded-xl p-4">
            <h3 className="font-semibold mb-4">智能体情绪分布</h3>
            <AgentSentimentPie data={sentimentData} />
          </div>
          
          {/* 市场叙事 */}
          <div className="bg-card-bg border border-border rounded-xl p-4">
            <h3 className="font-semibold mb-4">关键事件时间线</h3>
            <div className="space-y-3">
              {report.narrative.map((event, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-2 h-2 rounded-full bg-accent-blue mt-2" />
                  <div className="flex-1">
                    <div className="text-sm">{event.content}</div>
                    <div className="text-xs text-text-secondary">
                      {new Date(event.timestamp).toLocaleString()}
                      {event.agent_id && <span className="ml-2">by {event.agent_id}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* 右侧 */}
        <div className="space-y-6">
          {/* 影响关系图谱 */}
          <div className="bg-card-bg border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold flex items-center gap-2">
                <Network size={18} />
                智能体影响关系
              </h3>
            </div>
            <AgentGraph nodes={graphNodes} edges={graphEdges} height={350} />
          </div>
          
          {/* 恐惧贪婪变化 */}
          <div className="bg-card-bg border border-border rounded-xl p-4">
            <h3 className="font-semibold mb-4">恐惧贪婪指数变化</h3>
            <PositionChart data={[
              { time: 'D1', value: 45 },
              { time: 'D2', value: 48 },
              { time: 'D3', value: 52 },
              { time: 'D4', value: 55 },
              { time: 'D5', value: 58 },
              { time: 'D6', value: 60 },
              { time: 'D7', value: 62 },
            ]} />
          </div>
        </div>
      </div>
    </div>
  )
}
