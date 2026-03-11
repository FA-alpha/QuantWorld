import { useEffect, useState } from 'react'
import { Activity, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react'

interface MarketData {
  fear_greed?: { value: number; classification: string }
  liquidations?: { total_usd: number; total_long_usd: number; total_short_usd: number }
  funding_rates?: any
  etf_flows?: { BTC?: { latest_flow: number } }
}

interface MarketPanelProps {
  data?: MarketData
}

export default function MarketPanel({ data }: MarketPanelProps) {
  const fearGreed = data?.fear_greed?.value ?? 50
  const classification = data?.fear_greed?.classification ?? 'Neutral'
  
  const getFearGreedColor = (value: number) => {
    if (value < 25) return 'text-accent-red'
    if (value < 45) return 'text-orange-400'
    if (value < 55) return 'text-yellow-400'
    if (value < 75) return 'text-lime-400'
    return 'text-accent-green'
  }
  
  return (
    <div className="bg-card-bg border border-border rounded-xl p-4">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Activity size={18} className="text-accent-blue" />
        市场数据
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        {/* 恐惧贪婪指数 */}
        <div className="bg-dark-bg rounded-lg p-3">
          <div className="text-xs text-text-secondary mb-1">恐惧贪婪指数</div>
          <div className={`text-2xl font-bold ${getFearGreedColor(fearGreed)}`}>
            {fearGreed}
          </div>
          <div className="text-xs text-text-secondary">{classification}</div>
        </div>
        
        {/* 清算数据 */}
        <div className="bg-dark-bg rounded-lg p-3">
          <div className="text-xs text-text-secondary mb-1">24H 清算</div>
          <div className="text-lg font-bold">
            ${((data?.liquidations?.total_usd ?? 0) / 1e6).toFixed(1)}M
          </div>
          <div className="flex gap-2 text-xs">
            <span className="text-accent-green">
              多: ${((data?.liquidations?.total_long_usd ?? 0) / 1e6).toFixed(1)}M
            </span>
            <span className="text-accent-red">
              空: ${((data?.liquidations?.total_short_usd ?? 0) / 1e6).toFixed(1)}M
            </span>
          </div>
        </div>
        
        {/* ETF 流入 */}
        <div className="bg-dark-bg rounded-lg p-3 col-span-2">
          <div className="text-xs text-text-secondary mb-1">BTC ETF 资金流</div>
          <div className="flex items-center gap-2">
            {(data?.etf_flows?.BTC?.latest_flow ?? 0) > 0 ? (
              <TrendingUp size={18} className="text-accent-green" />
            ) : (
              <TrendingDown size={18} className="text-accent-red" />
            )}
            <span className={`text-lg font-bold ${
              (data?.etf_flows?.BTC?.latest_flow ?? 0) > 0 ? 'text-accent-green' : 'text-accent-red'
            }`}>
              ${((data?.etf_flows?.BTC?.latest_flow ?? 0) / 1e6).toFixed(1)}M
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
