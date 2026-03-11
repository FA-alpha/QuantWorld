"""
仿真引擎 - 时序推演核心
"""

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Callable
import asyncio


class SimulationEngine:
    """仿真引擎"""
    
    def __init__(
        self,
        start_time: datetime = None,
        end_time: datetime = None,
        interval_hours: int = 1
    ):
        self.start_time = start_time or datetime.utcnow()
        self.end_time = end_time or (self.start_time + timedelta(days=7))
        self.interval = timedelta(hours=interval_hours)
        self.current_time = self.start_time
        
        self.agents = []
        self.market_data = {}
        self.history = []
        self.events = []
        self.running = False
        self.coinglass = None
    
    def set_coinglass(self, service):
        """设置 Coinglass 服务"""
        self.coinglass = service
    
    def add_agent(self, agent):
        """添加智能体"""
        self.agents.append(agent)
        self.events.append({
            "time": self.current_time.isoformat(),
            "type": "agent_added",
            "agent_id": agent.agent_id,
            "agent_name": agent.name,
            "agent_type": agent.agent_type
        })
    
    async def fetch_market_data(self) -> Dict[str, Any]:
        """获取市场数据"""
        if self.coinglass:
            try:
                return await self.coinglass.get_market_snapshot()
            except Exception as e:
                print(f"Error fetching market data: {e}")
        
        return {
            "timestamp": self.current_time.isoformat(),
            "fear_greed": {"value": 50, "classification": "Neutral"},
            "price_change_24h": 0,
            "funding_rates": {},
            "liquidations": {},
            "etf_flows": {},
            "open_interest": {}
        }
    
    async def run_tick(self) -> Dict[str, Any]:
        """运行一个时间步"""
        tick_result = {
            "time": self.current_time.isoformat(),
            "market_data": {},
            "agent_actions": [],
            "events": []
        }
        
        # 获取市场数据
        self.market_data = await self.fetch_market_data()
        tick_result["market_data"] = self.market_data
        
        # 智能体循环
        for agent in self.agents:
            try:
                await agent.perceive(self.market_data)
                decision = await agent.decide()
                
                if decision.get("action") != "hold":
                    action = await agent.act(decision)
                    action["executed_at"] = self.current_time.isoformat()
                    tick_result["agent_actions"].append(action)
                    self.events.append({
                        "time": self.current_time.isoformat(),
                        "type": "agent_action",
                        **action
                    })
            except Exception as e:
                print(f"Agent {agent.agent_id} error: {e}")
        
        self.history.append(tick_result)
        self.current_time += self.interval
        
        return tick_result
    
    async def run(self, callback: Callable = None) -> List[Dict]:
        """运行完整仿真"""
        self.running = True
        results = []
        
        while self.current_time < self.end_time and self.running:
            tick_result = await self.run_tick()
            results.append(tick_result)
            
            if callback:
                await callback(tick_result)
            
            await asyncio.sleep(0.5)
        
        return results
    
    def stop(self):
        self.running = False
    
    def get_state(self) -> Dict[str, Any]:
        return {
            "current_time": self.current_time.isoformat(),
            "start_time": self.start_time.isoformat(),
            "end_time": self.end_time.isoformat(),
            "interval_hours": self.interval.total_seconds() / 3600,
            "agents": [a.to_dict() for a in self.agents],
            "total_events": len(self.events),
            "total_ticks": len(self.history),
            "running": self.running
        }
