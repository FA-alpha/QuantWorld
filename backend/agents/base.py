"""
智能体基类 - QuantWorld 多智能体仿真系统
"""

from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
import uuid


class Memory(BaseModel):
    """智能体记忆"""
    timestamp: datetime
    event_type: str
    content: str
    importance: float = 0.5  # 0-1 重要性评分
    embedding: Optional[List[float]] = None  # 向量嵌入 (GraphRAG)


class AgentState(BaseModel):
    """智能体状态"""
    sentiment: float = 0.5  # 0=极度悲观, 1=极度乐观
    confidence: float = 0.5  # 0=完全不确定, 1=完全确信
    risk_appetite: float = 0.5  # 风险偏好
    position: Dict[str, float] = {}  # 持仓 {symbol: amount}
    cash: float = 10000.0  # 可用资金


class BaseAgent(ABC):
    """智能体基类"""
    
    def __init__(
        self,
        agent_id: str = None,
        name: str = "Agent",
        agent_type: str = "generic",
        personality: Dict[str, float] = None
    ):
        self.agent_id = agent_id or str(uuid.uuid4())[:8]
        self.name = name
        self.agent_type = agent_type
        self.state = AgentState()
        self.memories: List[Memory] = []
        self.personality = personality or {
            "rationality": 0.5,  # 理性程度
            "risk_tolerance": 0.5,  # 风险承受
            "trend_following": 0.5,  # 趋势跟随倾向
            "information_sensitivity": 0.5  # 信息敏感度
        }
        self.created_at = datetime.utcnow()
    
    @abstractmethod
    async def perceive(self, market_data: Dict[str, Any]) -> None:
        """感知市场数据"""
        pass
    
    @abstractmethod
    async def decide(self) -> Dict[str, Any]:
        """做出决策"""
        pass
    
    @abstractmethod
    async def act(self, decision: Dict[str, Any]) -> Dict[str, Any]:
        """执行行动"""
        pass
    
    def add_memory(self, event_type: str, content: str, importance: float = 0.5):
        """添加记忆"""
        memory = Memory(
            timestamp=datetime.utcnow(),
            event_type=event_type,
            content=content,
            importance=importance
        )
        self.memories.append(memory)
        # 保持记忆在合理范围内
        if len(self.memories) > 1000:
            # 按重要性排序，保留重要的
            self.memories.sort(key=lambda m: m.importance, reverse=True)
            self.memories = self.memories[:800]
    
    def get_recent_memories(self, limit: int = 10) -> List[Memory]:
        """获取最近的记忆"""
        return sorted(self.memories, key=lambda m: m.timestamp, reverse=True)[:limit]
    
    def to_dict(self) -> Dict[str, Any]:
        """转为字典"""
        return {
            "agent_id": self.agent_id,
            "name": self.name,
            "agent_type": self.agent_type,
            "state": self.state.model_dump(),
            "personality": self.personality,
            "memory_count": len(self.memories),
            "created_at": self.created_at.isoformat()
        }
