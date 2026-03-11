"""
影响者智能体 - 分析师、KOL 等能影响市场情绪的角色
"""

from typing import Any, Dict, List
from .base import BaseAgent, AgentState
import random


class AnalystAgent(BaseAgent):
    """分析师 - 发布研报，影响其他智能体"""
    
    def __init__(self, name: str = None, specialty: str = "technical", **kwargs):
        super().__init__(
            name=name or f"Analyst_{random.randint(100, 999)}",
            agent_type="analyst",
            personality={
                "rationality": 0.8,
                "risk_tolerance": 0.5,
                "trend_following": 0.4,
                "information_sensitivity": 0.85,
                "influence_power": 0.6  # 影响力
            },
            **kwargs
        )
        self.specialty = specialty  # technical, fundamental, onchain
        self.published_reports: List[Dict] = []
        self.followers_count = random.randint(1000, 100000)
    
    async def perceive(self, market_data: Dict[str, Any]) -> None:
        """感知市场数据并形成观点"""
        fear_greed = market_data.get("fear_greed", {}).get("value", 50)
        oi = market_data.get("open_interest", {}).get("BTC", {})
        funding = market_data.get("funding_rates", {}).get("BTC", [])
        
        # 技术分析师关注资金费率和OI
        if self.specialty == "technical":
            if funding:
                avg_rate = sum(f.get("rate", 0) for f in funding) / len(funding)
                if avg_rate > 0.01:
                    self.state.sentiment = 0.3  # 看空
                    self.add_memory("analysis", f"资金费率过高({avg_rate:.4f})，多头拥挤", importance=0.8)
                elif avg_rate < -0.005:
                    self.state.sentiment = 0.7  # 看多
                    self.add_memory("analysis", f"负资金费率({avg_rate:.4f})，空头过多", importance=0.8)
        
        # 链上分析师关注 ETF 流向
        elif self.specialty == "onchain":
            etf_flow = market_data.get("etf_flows", {}).get("BTC", {}).get("latest_flow", 0)
            if etf_flow > 100_000_000:
                self.state.sentiment = 0.75
                self.add_memory("onchain", f"ETF 大额流入 ${etf_flow/1e6:.1f}M", importance=0.9)
            elif etf_flow < -100_000_000:
                self.state.sentiment = 0.25
                self.add_memory("onchain", f"ETF 大额流出 ${etf_flow/1e6:.1f}M", importance=0.9)
    
    async def decide(self) -> Dict[str, Any]:
        """决定是否发布报告"""
        # 如果有强烈观点，发布报告
        if self.state.sentiment < 0.3 or self.state.sentiment > 0.7:
            direction = "bullish" if self.state.sentiment > 0.5 else "bearish"
            confidence = abs(self.state.sentiment - 0.5) * 2
            
            return {
                "action": "publish_report",
                "symbol": "BTC",
                "direction": direction,
                "confidence": confidence,
                "reason": self.get_recent_memories(1)[0].content if self.memories else "Market analysis"
            }
        
        return {"action": "hold", "symbol": "BTC", "amount": 0, "reason": "观望，等待更明确信号"}
    
    async def act(self, decision: Dict[str, Any]) -> Dict[str, Any]:
        if decision.get("action") == "publish_report":
            report = {
                "analyst_id": self.agent_id,
                "analyst_name": self.name,
                "specialty": self.specialty,
                **decision
            }
            self.published_reports.append(report)
            return report
        return decision


class KOLAgent(BaseAgent):
    """KOL (Key Opinion Leader) - 社交媒体意见领袖"""
    
    def __init__(self, name: str = None, platform: str = "twitter", **kwargs):
        super().__init__(
            name=name or f"KOL_{random.randint(100, 999)}",
            agent_type="kol",
            personality={
                "rationality": 0.4,  # 不一定理性
                "risk_tolerance": 0.7,
                "trend_following": 0.6,
                "information_sensitivity": 0.7,
                "influence_power": random.uniform(0.3, 0.9)
            },
            **kwargs
        )
        self.platform = platform
        self.followers = random.randint(10000, 1000000)
        self.posts: List[Dict] = []
        self.shill_coins: List[str] = []  # 喊单币种
    
    async def perceive(self, market_data: Dict[str, Any]) -> None:
        """感知市场热度"""
        fear_greed = market_data.get("fear_greed", {}).get("value", 50)
        
        # KOL 情绪容易被市场放大
        self.state.sentiment = (fear_greed / 100) ** 0.8  # 非线性放大
        
        # 大涨时 FOMO
        if market_data.get("price_change_24h", 0) > 10:
            self.state.sentiment = min(1.0, self.state.sentiment * 1.5)
            self.add_memory("hype", "市场火热，准备喊单", importance=0.7)
    
    async def decide(self) -> Dict[str, Any]:
        """决定是否发帖"""
        if self.state.sentiment > 0.6:
            return {
                "action": "post",
                "content_type": "bullish_call",
                "symbol": random.choice(["BTC", "ETH", "SOL"]),
                "reason": "市场情绪高涨，蹭热度"
            }
        elif self.state.sentiment < 0.3:
            return {
                "action": "post",
                "content_type": "fud",
                "symbol": "BTC",
                "reason": "市场恐慌，发 FUD"
            }
        
        return {"action": "hold", "symbol": "BTC", "amount": 0, "reason": ""}
    
    async def act(self, decision: Dict[str, Any]) -> Dict[str, Any]:
        if decision.get("action") == "post":
            post = {
                "kol_id": self.agent_id,
                "kol_name": self.name,
                "platform": self.platform,
                "followers": self.followers,
                "influence": self.personality.get("influence_power", 0.5),
                **decision
            }
            self.posts.append(post)
            return post
        return decision


class NewsAgent(BaseAgent):
    """新闻智能体 - 模拟新闻事件"""
    
    def __init__(self, name: str = "NewsBot", **kwargs):
        super().__init__(
            name=name,
            agent_type="news_agent",
            personality={
                "rationality": 1.0,
                "risk_tolerance": 0.5,
                "trend_following": 0.0,
                "information_sensitivity": 1.0,
                "influence_power": 0.8
            },
            **kwargs
        )
        self.news_queue: List[Dict] = []
    
    async def perceive(self, market_data: Dict[str, Any]) -> None:
        """不需要感知，由外部注入新闻"""
        pass
    
    def inject_news(self, news: Dict[str, Any]):
        """注入新闻事件"""
        self.news_queue.append({
            **news,
            "impact": news.get("impact", 0.5),  # -1 到 1，负面到正面
            "category": news.get("category", "general")  # regulatory, adoption, hack, macro
        })
    
    async def decide(self) -> Dict[str, Any]:
        """发布新闻"""
        if self.news_queue:
            news = self.news_queue.pop(0)
            return {
                "action": "publish_news",
                **news
            }
        return {"action": "hold", "symbol": "BTC", "amount": 0, "reason": ""}
    
    async def act(self, decision: Dict[str, Any]) -> Dict[str, Any]:
        return decision
