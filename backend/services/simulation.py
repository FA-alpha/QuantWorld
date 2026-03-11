"""
仿真引擎 - 时序推演核心（集成 GraphRAG）
"""

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Callable
import asyncio
import random

from backend.services.memory import GraphMemory, CollectiveMemory


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
        
        # GraphRAG 记忆系统
        self.collective_memory = CollectiveMemory()
    
    def set_coinglass(self, service):
        """设置 Coinglass 服务"""
        self.coinglass = service
    
    def add_agent(self, agent):
        """添加智能体"""
        self.agents.append(agent)
        
        # 为智能体创建记忆图谱
        memory = self.collective_memory.get_or_create_memory(agent.agent_id)
        memory.add_memory(
            content=f"智能体 {agent.name} ({agent.agent_type}) 加入仿真",
            node_type="system",
            importance=0.3
        )
        
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
                data = await self.coinglass.get_market_snapshot()
                # 广播市场状态到所有智能体
                self.collective_memory.broadcast_event(
                    event_content=f"市场快照: 恐惧贪婪={data.get('fear_greed', {}).get('value', 50)}",
                    event_type="market_state",
                    importance=0.4
                )
                return data
            except Exception as e:
                print(f"Error fetching market data: {e}")
        
        # 模拟数据
        return {
            "timestamp": self.current_time.isoformat(),
            "fear_greed": {"value": random.randint(20, 80), "classification": "Neutral"},
            "price_change_24h": random.uniform(-10, 10),
            "funding_rates": {
                "BTC": [{"exchange": "Binance", "rate": random.uniform(-0.01, 0.02)}]
            },
            "liquidations": {
                "total_usd": random.uniform(50000000, 500000000),
                "total_long_usd": random.uniform(30000000, 300000000),
                "total_short_usd": random.uniform(20000000, 200000000)
            },
            "etf_flows": {
                "BTC": {"latest_flow": random.uniform(-200000000, 300000000)}
            },
            "open_interest": {
                "BTC": {"open_interest": random.uniform(30000000000, 50000000000)}
            }
        }
    
    def _process_influence(self, action: Dict[str, Any], agent):
        """处理智能体影响传播"""
        # 如果是分析师发报告，影响其他智能体
        if action.get("action") == "publish_report":
            # 找到可能受影响的散户
            retail_agents = [a for a in self.agents if a.agent_type == "retail_trader"]
            influenced = random.sample(
                retail_agents,
                min(len(retail_agents), int(len(retail_agents) * agent.personality.get("influence_power", 0.5)))
            )
            
            self.collective_memory.propagate_influence(
                source_agent=agent.agent_id,
                target_agents=[a.agent_id for a in influenced],
                influence_content=f"分析师看{action.get('direction', 'neutral')}: {action.get('reason', '')}",
                influence_strength=action.get("confidence", 0.5)
            )
            
            # 调整受影响智能体的情绪
            direction_modifier = 1.3 if action.get("direction") == "bullish" else 0.7
            for a in influenced:
                a.state.sentiment = min(1.0, max(0.0, a.state.sentiment * direction_modifier))
        
        # 如果是 KOL 喊单
        elif action.get("action") == "post" and action.get("content_type") in ["bullish_call", "fud"]:
            retail_agents = [a for a in self.agents if a.agent_type == "retail_trader"]
            influence_ratio = agent.personality.get("influence_power", 0.5) * 0.3
            influenced = random.sample(
                retail_agents,
                min(len(retail_agents), int(len(retail_agents) * influence_ratio))
            )
            
            self.collective_memory.propagate_influence(
                source_agent=agent.agent_id,
                target_agents=[a.agent_id for a in influenced],
                influence_content=f"KOL {action.get('content_type')}: {action.get('reason', '')}",
                influence_strength=agent.personality.get("influence_power", 0.5)
            )
    
    async def run_tick(self) -> Dict[str, Any]:
        """运行一个时间步"""
        tick_result = {
            "time": self.current_time.isoformat(),
            "tick_number": len(self.history) + 1,
            "market_data": {},
            "agent_actions": [],
            "events": [],
            "memory_stats": {}
        }
        
        # 获取市场数据
        self.market_data = await self.fetch_market_data()
        tick_result["market_data"] = self.market_data
        
        # 智能体循环
        for agent in self.agents:
            try:
                # 感知
                await agent.perceive(self.market_data)
                
                # 决策
                decision = await agent.decide()
                
                # 执行
                if decision.get("action") not in ["hold", None]:
                    action = await agent.act(decision)
                    action["executed_at"] = self.current_time.isoformat()
                    tick_result["agent_actions"].append(action)
                    
                    # 记录到智能体的记忆图谱
                    memory = self.collective_memory.get_or_create_memory(agent.agent_id)
                    memory.add_memory(
                        content=f"执行 {action.get('action')}: {action.get('reason', '')}",
                        node_type="action",
                        importance=0.6 if action.get("action") in ["buy", "sell"] else 0.4,
                        metadata=action
                    )
                    
                    # 处理影响传播
                    self._process_influence(action, agent)
                    
                    self.events.append({
                        "time": self.current_time.isoformat(),
                        "type": "agent_action",
                        **action
                    })
            except Exception as e:
                print(f"Agent {agent.agent_id} error: {e}")
        
        # 收集记忆统计
        tick_result["memory_stats"] = {
            "total_memories": sum(
                m.graph.number_of_nodes()
                for m in self.collective_memory.agent_memories.values()
            ),
            "total_connections": sum(
                m.graph.number_of_edges()
                for m in self.collective_memory.agent_memories.values()
            )
        }
        
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
            
            await asyncio.sleep(0.1)  # 加快仿真速度
        
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
            "running": self.running,
            "memory_summary": {
                agent_id: {
                    "nodes": memory.graph.number_of_nodes(),
                    "edges": memory.graph.number_of_edges()
                }
                for agent_id, memory in self.collective_memory.agent_memories.items()
            }
        }
    
    def get_narrative(self, limit: int = 20) -> List[Dict]:
        """获取市场叙事"""
        return self.collective_memory.get_market_narrative(limit)
