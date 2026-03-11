"""
事件输入系统 - 支持文本、文件上传
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional
from enum import Enum
import hashlib
import json


class EventType(str, Enum):
    """事件类型"""
    # 宏观事件
    MACRO_POLICY = "macro_policy"  # 货币政策（降息、加息）
    MACRO_ECONOMIC = "macro_economic"  # 经济数据（CPI、GDP）
    GEOPOLITICAL = "geopolitical"  # 地缘政治
    
    # 加密行业事件
    REGULATORY = "regulatory"  # 监管政策
    EXCHANGE = "exchange"  # 交易所事件（上币、下架、暴雷）
    PROTOCOL = "protocol"  # 协议事件（升级、漏洞）
    WHALE_MOVE = "whale_move"  # 巨鲸动向
    ETF_FLOW = "etf_flow"  # ETF 资金流
    
    # 市场事件
    PRICE_SPIKE = "price_spike"  # 价格暴涨
    PRICE_CRASH = "price_crash"  # 价格暴跌
    LIQUIDATION = "liquidation"  # 大规模清算
    
    # 社交事件
    KOL_OPINION = "kol_opinion"  # KOL 观点
    NEWS = "news"  # 新闻
    RUMOR = "rumor"  # 传言
    
    # 自定义
    CUSTOM = "custom"


class EventImpact(str, Enum):
    """事件影响程度"""
    EXTREME_NEGATIVE = "extreme_negative"  # -2
    NEGATIVE = "negative"  # -1
    NEUTRAL = "neutral"  # 0
    POSITIVE = "positive"  # +1
    EXTREME_POSITIVE = "extreme_positive"  # +2


@dataclass
class SimulationEvent:
    """仿真事件"""
    event_id: str
    title: str
    content: str
    event_type: EventType
    impact: EventImpact
    
    # 时间
    timestamp: datetime = field(default_factory=datetime.utcnow)
    duration_hours: int = 24  # 事件影响持续时间
    
    # 影响范围
    affected_symbols: List[str] = field(default_factory=lambda: ["BTC", "ETH"])
    affected_agent_types: List[str] = field(default_factory=list)  # 空=所有
    
    # 量化影响
    sentiment_modifier: float = 0.0  # -1 到 1，影响情绪
    volatility_modifier: float = 0.0  # 波动率修正
    
    # 元数据
    source: str = "user_input"
    source_url: Optional[str] = None
    confidence: float = 1.0  # 事件可信度
    
    def to_dict(self) -> Dict:
        return {
            "event_id": self.event_id,
            "title": self.title,
            "content": self.content,
            "event_type": self.event_type.value,
            "impact": self.impact.value,
            "timestamp": self.timestamp.isoformat(),
            "duration_hours": self.duration_hours,
            "affected_symbols": self.affected_symbols,
            "sentiment_modifier": self.sentiment_modifier,
            "volatility_modifier": self.volatility_modifier,
            "source": self.source,
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> "SimulationEvent":
        return cls(
            event_id=data.get("event_id", ""),
            title=data.get("title", ""),
            content=data.get("content", ""),
            event_type=EventType(data.get("event_type", "custom")),
            impact=EventImpact(data.get("impact", "neutral")),
            timestamp=datetime.fromisoformat(data["timestamp"]) if data.get("timestamp") else datetime.utcnow(),
            duration_hours=data.get("duration_hours", 24),
            affected_symbols=data.get("affected_symbols", ["BTC", "ETH"]),
            sentiment_modifier=data.get("sentiment_modifier", 0.0),
            source=data.get("source", "user_input"),
        )


class EventParser:
    """事件解析器"""
    
    # 关键词映射
    KEYWORD_MAPPING = {
        # 宏观
        "降息": (EventType.MACRO_POLICY, EventImpact.POSITIVE, 0.3),
        "加息": (EventType.MACRO_POLICY, EventImpact.NEGATIVE, -0.3),
        "通胀": (EventType.MACRO_ECONOMIC, EventImpact.NEGATIVE, -0.1),
        "衰退": (EventType.MACRO_ECONOMIC, EventImpact.EXTREME_NEGATIVE, -0.5),
        "战争": (EventType.GEOPOLITICAL, EventImpact.EXTREME_NEGATIVE, -0.4),
        
        # 监管
        "批准": (EventType.REGULATORY, EventImpact.POSITIVE, 0.3),
        "禁止": (EventType.REGULATORY, EventImpact.EXTREME_NEGATIVE, -0.5),
        "监管": (EventType.REGULATORY, EventImpact.NEGATIVE, -0.2),
        "ETF": (EventType.ETF_FLOW, EventImpact.POSITIVE, 0.2),
        
        # 交易所
        "上币": (EventType.EXCHANGE, EventImpact.POSITIVE, 0.2),
        "下架": (EventType.EXCHANGE, EventImpact.NEGATIVE, -0.2),
        "暴雷": (EventType.EXCHANGE, EventImpact.EXTREME_NEGATIVE, -0.6),
        "黑客": (EventType.PROTOCOL, EventImpact.EXTREME_NEGATIVE, -0.5),
        
        # 市场
        "暴涨": (EventType.PRICE_SPIKE, EventImpact.EXTREME_POSITIVE, 0.4),
        "暴跌": (EventType.PRICE_CRASH, EventImpact.EXTREME_NEGATIVE, -0.4),
        "清算": (EventType.LIQUIDATION, EventImpact.NEGATIVE, -0.3),
        
        # 巨鲸
        "巨鲸": (EventType.WHALE_MOVE, EventImpact.NEUTRAL, 0.1),
        "大户": (EventType.WHALE_MOVE, EventImpact.NEUTRAL, 0.1),
    }
    
    @classmethod
    def parse_text(cls, text: str, title: str = None) -> SimulationEvent:
        """解析文本事件"""
        event_id = hashlib.sha256(f"{text}:{datetime.utcnow().isoformat()}".encode()).hexdigest()[:12]
        
        # 默认值
        event_type = EventType.CUSTOM
        impact = EventImpact.NEUTRAL
        sentiment_modifier = 0.0
        
        # 关键词匹配
        text_lower = text.lower()
        for keyword, (etype, eimpact, sentiment) in cls.KEYWORD_MAPPING.items():
            if keyword in text_lower:
                event_type = etype
                impact = eimpact
                sentiment_modifier = sentiment
                break
        
        # 提取可能的币种
        symbols = ["BTC"]  # 默认影响 BTC
        symbol_keywords = {
            "btc": "BTC", "比特币": "BTC", "bitcoin": "BTC",
            "eth": "ETH", "以太坊": "ETH", "ethereum": "ETH",
            "sol": "SOL", "solana": "SOL",
            "doge": "DOGE", "狗狗币": "DOGE",
        }
        for kw, sym in symbol_keywords.items():
            if kw in text_lower and sym not in symbols:
                symbols.append(sym)
        
        return SimulationEvent(
            event_id=event_id,
            title=title or text[:50],
            content=text,
            event_type=event_type,
            impact=impact,
            affected_symbols=symbols,
            sentiment_modifier=sentiment_modifier,
            source="text_input",
        )
    
    @classmethod
    def parse_file(cls, content: str, filename: str) -> List[SimulationEvent]:
        """解析文件内容"""
        events = []
        
        # 尝试 JSON 格式
        try:
            data = json.loads(content)
            if isinstance(data, list):
                for item in data:
                    events.append(SimulationEvent.from_dict(item))
            elif isinstance(data, dict):
                events.append(SimulationEvent.from_dict(data))
            return events
        except json.JSONDecodeError:
            pass
        
        # 纯文本，按段落分割
        paragraphs = [p.strip() for p in content.split("\n\n") if p.strip()]
        if len(paragraphs) == 1:
            # 单个事件
            events.append(cls.parse_text(content, title=filename))
        else:
            # 多个事件
            for i, para in enumerate(paragraphs):
                events.append(cls.parse_text(para, title=f"{filename}_event_{i+1}"))
        
        return events


class EventManager:
    """事件管理器"""
    
    def __init__(self):
        self.events: List[SimulationEvent] = []
        self.event_queue: List[SimulationEvent] = []  # 待触发的事件
    
    def add_event(self, event: SimulationEvent) -> str:
        """添加事件"""
        self.events.append(event)
        self.event_queue.append(event)
        return event.event_id
    
    def add_text_event(self, text: str, title: str = None) -> str:
        """从文本添加事件"""
        event = EventParser.parse_text(text, title)
        return self.add_event(event)
    
    def add_file_events(self, content: str, filename: str) -> List[str]:
        """从文件添加事件"""
        events = EventParser.parse_file(content, filename)
        return [self.add_event(e) for e in events]
    
    def get_pending_events(self, current_time: datetime) -> List[SimulationEvent]:
        """获取待触发的事件"""
        pending = []
        remaining = []
        
        for event in self.event_queue:
            if event.timestamp <= current_time:
                pending.append(event)
            else:
                remaining.append(event)
        
        self.event_queue = remaining
        return pending
    
    def get_active_events(self, current_time: datetime) -> List[SimulationEvent]:
        """获取当前活跃的事件（在影响时间内）"""
        active = []
        for event in self.events:
            end_time = event.timestamp + timedelta(hours=event.duration_hours)
            if event.timestamp <= current_time <= end_time:
                active.append(event)
        return active
    
    def to_dict(self) -> Dict:
        return {
            "total_events": len(self.events),
            "pending_count": len(self.event_queue),
            "events": [e.to_dict() for e in self.events],
        }


from datetime import timedelta
