import { Link } from 'react-router-dom'
import { ArrowRight, Bot, LineChart, Network, Zap } from 'lucide-react'

export default function HomePage() {
  const features = [
    {
      icon: Bot,
      title: '多智能体仿真',
      description: '散户、机构、巨鲸等不同类型交易者协同推演'
    },
    {
      icon: LineChart,
      title: '实时市场数据',
      description: '接入 Coinglass 链上数据，资金费率、清算、ETF 流向'
    },
    {
      icon: Network,
      title: 'GraphRAG 记忆',
      description: '智能体之间的关系和影响通过图谱存储'
    },
    {
      icon: Zap,
      title: '时序推演',
      description: '1小时颗粒度，模拟市场演化过程'
    }
  ]
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero */}
      <div className="text-center py-16">
        <h1 className="text-4xl font-bold mb-4">
          <span className="text-accent-blue">QuantWorld</span>
          <br />
          多智能体市场仿真系统
        </h1>
        <p className="text-text-secondary text-lg mb-8">
          基于 LLM 的加密货币市场预测与分析平台
        </p>
        <Link
          to="/console"
          className="inline-flex items-center gap-2 bg-accent-blue text-white px-6 py-3 rounded-lg font-medium hover:bg-accent-blue/80 transition"
        >
          开始仿真
          <ArrowRight size={20} />
        </Link>
      </div>
      
      {/* Features */}
      <div className="grid grid-cols-2 gap-6 mt-8">
        {features.map(feature => (
          <div key={feature.title} className="bg-card-bg border border-border rounded-xl p-6">
            <feature.icon className="text-accent-blue mb-4" size={32} />
            <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
            <p className="text-text-secondary">{feature.description}</p>
          </div>
        ))}
      </div>
      
      {/* Supported Coins */}
      <div className="mt-12 text-center">
        <h2 className="text-xl font-semibold mb-4">支持币种</h2>
        <div className="flex justify-center gap-4 flex-wrap">
          {['BTC', 'ETH', 'SOL', 'DOGE', 'XRP', 'ADA', 'BCH'].map(coin => (
            <span key={coin} className="bg-card-bg border border-border px-4 py-2 rounded-lg">
              {coin}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
