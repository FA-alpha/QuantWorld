"""
交易者智能体 - 不同类型的市场参与者
"""

from typing import Any, Dict, List
from .base import BaseAgent, AgentState
import random


class RetailTrader(BaseAgent):
    """散户交易者 - 容易受情绪影响，追涨杀跌"""
    
    def __init__(self, name: str = None, **kwargs):
        super().__init__(
            name=name or f"Retail_{random.randint(1000, 9999)}",
            agent_type="retail_trader",
            personality={
                "rationality": 0.3,
                "risk_tolerance": 0.4,
                "trend_following": 0.8,  # 高度追涨杀跌
                "information_sensitivity": 0.7
            },
            **kwargs
        )
        self.state.cash = random.uniform(1000, 50000)
    
    async def perceive(self, market_data: Dict[str, Any]) -> None:
        """感知市场 - 主要看价格和新闻"""
        fear_greed = market_data.get("fear_greed", {}).get("value", 50)
        
        # 散户情绪容易被恐惧贪婪指数影响
        self.state.sentiment = fear_greed / 100
        
        # 如果看到大跌就恐慌
        if market_data.get("price_change_24h", 0) < -5:
            self.state.sentiment *= 0.5
            self.add_memory("panic", "市场大跌，感到恐慌", importance=0.8)
        
        # 看到大涨就 FOMO
        if market_data.get("price_change_24h", 0) > 10:
            self.state.sentiment = min(1.0, self.state.sentiment * 1.5)
            self.add_memory("fomo", "市场大涨，害怕错过", importance=0.8)
    
    async def decide(self) -> Dict[str, Any]:
        """决策 - 情绪驱动"""
        decision = {"action": "hold", "symbol": "BTC", "amount": 0, "reason": ""}
        
        if self.state.sentiment > 0.7 and self.state.cash > 100:
            # FOMO 买入
            amount = self.state.cash * random.uniform(0.3, 0.8)
            decision = {
                "action": "buy",
                "symbol": "BTC",
                "amount": amount,
                "reason": "FOMO - 市场情绪高涨"
            }
        elif self.state.sentiment < 0.3:
            # 恐慌卖出
            btc_holding = self.state.position.get("BTC", 0)
            if btc_holding > 0:
                decision = {
                    "action": "sell",
                    "symbol": "BTC",
                    "amount": btc_holding * random.uniform(0.5, 1.0),
                    "reason": "恐慌 - 害怕继续下跌"
                }
        
        return decision
    
    async def act(self, decision: Dict[str, Any]) -> Dict[str, Any]:
        """执行 - 返回交易结果"""
        return {
            "agent_id": self.agent_id,
            "agent_type": self.agent_type,
            **decision,
            "executed_at": "pending"  # 由仿真引擎填充
        }


class InstitutionalTrader(BaseAgent):
    """机构交易者 - 理性分析，关注基本面"""
    
    def __init__(self, name: str = None, **kwargs):
        super().__init__(
            name=name or f"Institution_{random.randint(100, 999)}",
            agent_type="institutional_trader",
            personality={
                "rationality": 0.85,
                "risk_tolerance": 0.5,
                "trend_following": 0.3,
                "information_sensitivity": 0.9
            },
            **kwargs
        )
        self.state.cash = random.uniform(1000000, 10000000)
        self.position_limit = 0.2  # 单个标的最大仓位
    
    async def perceive(self, market_data: Dict[str, Any]) -> None:
        """感知市场 - 综合分析"""
        # 分析资金费率
        funding = market_data.get("funding_rates", {}).get("BTC", [])
        if funding:
            avg_funding = sum(f.get("rate", 0) for f in funding) / len(funding)
            # 资金费率过高说明多头拥挤
            if avg_funding > 0.01:
                self.state.risk_appetite *= 0.8
                self.add_memory("funding_high", f"资金费率高 {avg_funding:.4f}，多头拥挤", importance=0.7)
        
        # 分析 ETF 流入
        etf_flow = market_data.get("etf_flows", {}).get("BTC", {}).get("latest_flow", 0)
        if etf_flow > 100_000_000:  # >1亿流入
            self.state.sentiment = min(1.0, self.state.sentiment + 0.2)
            self.add_memory("etf_inflow", f"ETF 大额流入 ${etf_flow/1e6:.1f}M", importance=0.8)
        elif etf_flow < -100_000_000:  # >1亿流出
            self.state.sentiment = max(0.0, self.state.sentiment - 0.2)
            self.add_memory("etf_outflow", f"ETF 大额流出 ${etf_flow/1e6:.1f}M", importance=0.8)
    
    async def decide(self) -> Dict[str, Any]:
        """决策 - 理性分析"""
        decision = {"action": "hold", "symbol": "BTC", "amount": 0, "reason": ""}
        
        # 基于综合分析
        score = (
            self.state.sentiment * 0.3 +
            self.state.confidence * 0.3 +
            self.state.risk_appetite * 0.4
        )
        
        current_position_value = self.state.position.get("BTC", 0) * 80000  # 假设价格
        max_position = self.state.cash * self.position_limit
        
        if score > 0.6 and current_position_value < max_position:
            # 逐步建仓
            amount = min(
                self.state.cash * 0.05,  # 每次最多 5% 资金
                max_position - current_position_value
            )
            decision = {
                "action": "buy",
                "symbol": "BTC",
                "amount": amount,
                "reason": f"综合评分 {score:.2f}，逐步建仓"
            }
        elif score < 0.35 and self.state.position.get("BTC", 0) > 0:
            # 减仓
            decision = {
                "action": "sell",
                "symbol": "BTC",
                "amount": self.state.position["BTC"] * 0.3,
                "reason": f"综合评分 {score:.2f}，风险控制减仓"
            }
        
        return decision
    
    async def act(self, decision: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "agent_id": self.agent_id,
            "agent_type": self.agent_type,
            **decision,
            "executed_at": "pending"
        }


class WhaleTrader(BaseAgent):
    """巨鲸交易者 - 有内部信息，能影响市场"""
    
    def __init__(self, name: str = None, **kwargs):
        super().__init__(
            name=name or f"Whale_{random.randint(10, 99)}",
            agent_type="whale_trader",
            personality={
                "rationality": 0.9,
                "risk_tolerance": 0.7,
                "trend_following": 0.2,
                "information_sensitivity": 1.0  # 信息最灵通
            },
            **kwargs
        )
        self.state.cash = random.uniform(50000000, 500000000)
    
    async def perceive(self, market_data: Dict[str, Any]) -> None:
        """感知市场 - 获取最全面信息"""
        # 巨鲸关注清算数据
        liquidations = market_data.get("liquidations", {})
        if liquidations:
            long_liq = liquidations.get("total_long_usd", 0)
            short_liq = liquidations.get("total_short_usd", 0)
            
            # 大量多头清算 = 可能是底部
            if long_liq > 500_000_000:
                self.state.sentiment = min(1.0, self.state.sentiment + 0.3)
                self.add_memory("long_liquidation", f"多头大清算 ${long_liq/1e6:.0f}M，可能见底", importance=0.9)
        
        # 关注 OI 变化
        oi = market_data.get("open_interest", {}).get("BTC")
        if oi:
            self.add_memory("oi_update", f"BTC OI: ${oi.get('open_interest', 0)/1e9:.2f}B", importance=0.5)
    
    async def decide(self) -> Dict[str, Any]:
        """决策 - 战略性"""
        # 巨鲸决策更复杂，这里简化
        return {"action": "hold", "symbol": "BTC", "amount": 0, "reason": "观望中"}
    
    async def act(self, decision: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "agent_id": self.agent_id,
            "agent_type": self.agent_type,
            **decision,
            "executed_at": "pending"
        }
