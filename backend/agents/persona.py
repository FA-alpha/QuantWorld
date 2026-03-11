"""
智能体人设系统 - 详细的性格、背景设定
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional
from enum import Enum
import random


class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class PersonalityTrait(str, Enum):
    """性格特征"""
    CONSERVATIVE = "conservative"  # 保守
    AGGRESSIVE = "aggressive"  # 激进
    RATIONAL = "rational"  # 理性
    EMOTIONAL = "emotional"  # 情绪化
    PATIENT = "patient"  # 耐心
    IMPULSIVE = "impulsive"  # 冲动
    OPTIMISTIC = "optimistic"  # 乐观
    PESSIMISTIC = "pessimistic"  # 悲观


class RiskLevel(str, Enum):
    """风险偏好"""
    VERY_LOW = "very_low"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"


@dataclass
class PersonaBackground:
    """人设背景"""
    age: int = 30
    gender: Gender = Gender.MALE
    occupation: str = "投资者"
    education: str = "本科"
    location: str = "北京"
    investment_years: int = 3
    initial_capital: float = 100000.0
    monthly_income: float = 20000.0
    
    # 投资经历
    biggest_win: Optional[str] = None  # 最大盈利经历
    biggest_loss: Optional[str] = None  # 最大亏损经历
    investment_philosophy: str = "稳健投资"
    
    # 社交属性
    followers_count: int = 0
    influence_level: float = 0.1  # 0-1


@dataclass
class PersonaTraits:
    """性格特征"""
    primary_trait: PersonalityTrait = PersonalityTrait.RATIONAL
    secondary_trait: Optional[PersonalityTrait] = None
    risk_level: RiskLevel = RiskLevel.MEDIUM
    
    # 数值化特征 (0-1)
    rationality: float = 0.5
    patience: float = 0.5
    confidence: float = 0.5
    greed: float = 0.5
    fear: float = 0.5
    fomo_tendency: float = 0.5  # FOMO 倾向
    herd_behavior: float = 0.5  # 羊群效应倾向
    
    # 信息处理
    news_sensitivity: float = 0.5  # 对新闻敏感度
    data_analysis: float = 0.5  # 数据分析能力
    social_influence: float = 0.5  # 受社交媒体影响程度


@dataclass
class AgentPersona:
    """完整的智能体人设"""
    name: str
    agent_type: str
    background: PersonaBackground = field(default_factory=PersonaBackground)
    traits: PersonaTraits = field(default_factory=PersonaTraits)
    
    # 自定义描述
    bio: str = ""  # 人设简介
    trading_style: str = ""  # 交易风格描述
    
    def to_dict(self) -> Dict:
        return {
            "name": self.name,
            "agent_type": self.agent_type,
            "background": {
                "age": self.background.age,
                "gender": self.background.gender.value,
                "occupation": self.background.occupation,
                "education": self.background.education,
                "location": self.background.location,
                "investment_years": self.background.investment_years,
                "initial_capital": self.background.initial_capital,
                "investment_philosophy": self.background.investment_philosophy,
            },
            "traits": {
                "primary_trait": self.traits.primary_trait.value,
                "secondary_trait": self.traits.secondary_trait.value if self.traits.secondary_trait else None,
                "risk_level": self.traits.risk_level.value,
                "rationality": self.traits.rationality,
                "patience": self.traits.patience,
                "confidence": self.traits.confidence,
                "fomo_tendency": self.traits.fomo_tendency,
                "herd_behavior": self.traits.herd_behavior,
            },
            "bio": self.bio,
            "trading_style": self.trading_style,
        }
    
    def to_prompt(self) -> str:
        """生成用于 LLM 的人设 Prompt"""
        return f"""你是 {self.name}，一位 {self.background.age} 岁的{self.background.gender.value == 'male' and '男性' or '女性'}{self.background.occupation}。

背景：
- 学历：{self.background.education}
- 所在地：{self.background.location}
- 投资经验：{self.background.investment_years} 年
- 初始资金：{self.background.initial_capital:,.0f} 元
- 投资理念：{self.background.investment_philosophy}

性格特点：
- 主要性格：{self.traits.primary_trait.value}
- 风险偏好：{self.traits.risk_level.value}
- 理性程度：{self.traits.rationality:.0%}
- FOMO 倾向：{self.traits.fomo_tendency:.0%}
- 羊群效应：{self.traits.herd_behavior:.0%}

{self.bio}

交易风格：{self.trading_style}"""


# 预设人设模板
PERSONA_TEMPLATES = {
    "retail_newbie": AgentPersona(
        name="小白",
        agent_type="retail_trader",
        background=PersonaBackground(
            age=25,
            gender=Gender.MALE,
            occupation="程序员",
            investment_years=1,
            initial_capital=50000,
            investment_philosophy="追热点",
        ),
        traits=PersonaTraits(
            primary_trait=PersonalityTrait.IMPULSIVE,
            risk_level=RiskLevel.HIGH,
            rationality=0.3,
            patience=0.2,
            fomo_tendency=0.8,
            herd_behavior=0.9,
        ),
        bio="刚入币圈的新人，听说炒币能暴富就进来了。喜欢看 KOL 推荐，容易 FOMO。",
        trading_style="追涨杀跌，喜欢梭哈",
    ),
    
    "retail_veteran": AgentPersona(
        name="老韭菜",
        agent_type="retail_trader",
        background=PersonaBackground(
            age=35,
            gender=Gender.MALE,
            occupation="销售",
            investment_years=5,
            initial_capital=200000,
            biggest_loss="2022年 LUNA 爆仓亏了 80%",
            investment_philosophy="活着比赚钱重要",
        ),
        traits=PersonaTraits(
            primary_trait=PersonalityTrait.CONSERVATIVE,
            risk_level=RiskLevel.LOW,
            rationality=0.6,
            patience=0.7,
            fear=0.7,
            fomo_tendency=0.3,
        ),
        bio="经历过几轮牛熊的老韭菜，被割过很多次，现在变得保守了。",
        trading_style="只买 BTC/ETH，不碰山寨，设止损",
    ),
    
    "institution_fund": AgentPersona(
        name="Alpha 基金",
        agent_type="institutional_trader",
        background=PersonaBackground(
            age=40,
            gender=Gender.MALE,
            occupation="基金经理",
            education="MBA",
            investment_years=15,
            initial_capital=50000000,
            investment_philosophy="风险调整后收益最大化",
        ),
        traits=PersonaTraits(
            primary_trait=PersonalityTrait.RATIONAL,
            risk_level=RiskLevel.MEDIUM,
            rationality=0.9,
            patience=0.8,
            data_analysis=0.9,
            herd_behavior=0.1,
        ),
        bio="管理 5000 万美元加密资产的专业基金经理，依靠数据和模型做决策。",
        trading_style="量化策略，分批建仓，严格风控",
    ),
    
    "whale_og": AgentPersona(
        name="巨鲸 OG",
        agent_type="whale_trader",
        background=PersonaBackground(
            age=45,
            gender=Gender.MALE,
            occupation="早期投资者",
            investment_years=10,
            initial_capital=100000000,
            biggest_win="2017年 ICO 投资 100x",
            investment_philosophy="长期持有，逆向操作",
        ),
        traits=PersonaTraits(
            primary_trait=PersonalityTrait.PATIENT,
            risk_level=RiskLevel.HIGH,
            rationality=0.8,
            patience=0.9,
            confidence=0.9,
            herd_behavior=0.0,
        ),
        bio="2013年就开始玩 BTC 的 OG，手上有大量 BTC。喜欢在别人恐慌时抄底。",
        trading_style="逆向投资，大跌时抄底，分批出货",
    ),
    
    "kol_influencer": AgentPersona(
        name="加密 KOL",
        agent_type="kol",
        background=PersonaBackground(
            age=30,
            gender=Gender.FEMALE,
            occupation="自媒体",
            investment_years=4,
            initial_capital=500000,
            followers_count=100000,
            influence_level=0.7,
        ),
        traits=PersonaTraits(
            primary_trait=PersonalityTrait.AGGRESSIVE,
            risk_level=RiskLevel.HIGH,
            confidence=0.9,
            social_influence=0.8,
        ),
        bio="Twitter 10 万粉的加密 KOL，经常喊单。喜欢蹭热点，影响力大。",
        trading_style="快进快出，喜欢山寨币",
    ),
    
    "analyst_technical": AgentPersona(
        name="技术分析师",
        agent_type="analyst",
        background=PersonaBackground(
            age=35,
            gender=Gender.MALE,
            occupation="分析师",
            education="金融学硕士",
            investment_years=8,
        ),
        traits=PersonaTraits(
            primary_trait=PersonalityTrait.RATIONAL,
            risk_level=RiskLevel.MEDIUM,
            rationality=0.85,
            data_analysis=0.95,
            news_sensitivity=0.6,
        ),
        bio="专注技术分析的研究员，擅长看图形、资金费率、链上数据。",
        trading_style="基于技术指标交易",
    ),
}


def create_random_persona(agent_type: str, base_template: str = None) -> AgentPersona:
    """创建随机人设"""
    if base_template and base_template in PERSONA_TEMPLATES:
        # 基于模板微调
        template = PERSONA_TEMPLATES[base_template]
        persona = AgentPersona(
            name=f"{template.name}_{random.randint(1, 999)}",
            agent_type=agent_type,
            background=PersonaBackground(
                age=template.background.age + random.randint(-5, 5),
                gender=random.choice(list(Gender)),
                occupation=template.background.occupation,
                investment_years=max(1, template.background.investment_years + random.randint(-2, 2)),
                initial_capital=template.background.initial_capital * random.uniform(0.5, 2.0),
            ),
            traits=PersonaTraits(
                primary_trait=template.traits.primary_trait,
                risk_level=template.traits.risk_level,
                rationality=min(1, max(0, template.traits.rationality + random.uniform(-0.1, 0.1))),
                patience=min(1, max(0, template.traits.patience + random.uniform(-0.1, 0.1))),
                fomo_tendency=min(1, max(0, template.traits.fomo_tendency + random.uniform(-0.1, 0.1))),
            ),
            bio=template.bio,
            trading_style=template.trading_style,
        )
        return persona
    
    # 完全随机
    return AgentPersona(
        name=f"Agent_{random.randint(1000, 9999)}",
        agent_type=agent_type,
        background=PersonaBackground(
            age=random.randint(20, 60),
            gender=random.choice(list(Gender)),
            investment_years=random.randint(1, 15),
            initial_capital=random.uniform(10000, 10000000),
        ),
        traits=PersonaTraits(
            primary_trait=random.choice(list(PersonalityTrait)),
            risk_level=random.choice(list(RiskLevel)),
            rationality=random.uniform(0.2, 0.9),
            fomo_tendency=random.uniform(0.1, 0.9),
        ),
    )
