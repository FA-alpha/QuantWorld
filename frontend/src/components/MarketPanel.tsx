import { FearGreedGauge, FundFlowChart, LiquidationChart } from './Charts'
import { Activity } from 'lucide-react'

interface MarketData {
  fear_greed?: { value: number; classification: string }
  liquidations?: { total_usd: number; total_long_usd: number; total_short_usd: number }
  funding_rates?: any
  etf_flows?: { BTC?: { latest_flow: number; history?: { date: string; flow: number }[] } }
}

export default function MarketPanel({ data }: { data?: MarketData }) {
  const fearGreed = data?.fear_greed?.value ?? 50
  const etfHistory = data?.etf_flows?.BTC?.history ?? [
    { date: '2026-03-05', flow: 50000000 },
    { date: '2026-03-06', flow: -30000000 },
    { date: '2026-03-07', flow: 80000000 },
    { date: '2026-03-08', flow: 120000000 },
    { date: '2026-03-09', flow: -20000000 },
    { date: '2026-03-10', flow: 60000000 },
    { date: '2026-03-11', flow: 90000000 },
  ]
  
  return (
    <div className="space-y-4">
      {/* 恐惧贪婪指数 */}
      <div className="bg-card-bg border border-border rounded-xl p-4">
        <h3 className="font-semibold mb-2 flex items-center gap-2 text-sm">
          <Activity size={16} className="text-accent-blue" />
          恐惧贪婪指数
        </h3>
        <FearGreedGauge value={fearGreed} />
      </div>
      
      {/* ETF 资金流 */}
      <div className="bg-card-bg border border-border rounded-xl p-4">
        <h3 className="font-semibold mb-2 text-sm">BTC ETF 资金流 (7D)</h3>
        <FundFlowChart data={etfHistory} />
      </div>
      
      {/* 清算数据 */}
      <div className="bg-card-bg border border-border rounded-xl p-4">
        <h3 className="font-semibold mb-2 text-sm">24H 清算</h3>
        <LiquidationChart 
          long={data?.liquidations?.total_long_usd ?? 150000000}
          short={data?.liquidations?.total_short_usd ?? 100000000}
        />
      </div>
    </div>
  )
}
