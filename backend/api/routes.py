"""
API 路由定义 - 支持事件输入和人设配置
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, UploadFile, File, Form
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import uuid
import asyncio

from backend.agents.trader import RetailTrader, InstitutionalTrader, WhaleTrader
from backend.agents.influencer import AnalystAgent, KOLAgent
from backend.agents.persona import (
    AgentPersona, PERSONA_TEMPLATES, create_random_persona,
    PersonaBackground, PersonaTraits, Gender, PersonalityTrait, RiskLevel
)
from backend.services.simulation import SimulationEngine
from backend.services.coinglass import CoinglassService
from backend.services.events import EventManager, EventParser, SimulationEvent, EventType, EventImpact

router = APIRouter(prefix="/api")

# 存储活跃的仿真
active_simulations: Dict[str, Dict] = {}


# ============ 请求/响应模型 ============

class AgentConfig(BaseModel):
    """单个智能体配置"""
    agent_type: str  # retail_trader, institutional_trader, whale_trader, analyst, kol
    count: int = 1
    persona_template: Optional[str] = None  # 使用预设模板
    custom_persona: Optional[Dict] = None  # 自定义人设


class EventInput(BaseModel):
    """事件输入"""
    title: str
    content: str
    event_type: str = "custom"
    impact: str = "neutral"
    affected_symbols: List[str] = ["BTC"]
    sentiment_modifier: float = 0.0


class SimulationConfig(BaseModel):
    """仿真配置"""
    name: str = "新仿真"
    description: str = ""
    duration_hours: int = 168  # 7天
    interval_hours: int = 1
    
    # 智能体配置
    agents: List[AgentConfig] = []
    
    # 或使用简化配置
    agent_counts: Optional[Dict[str, int]] = None  # {"retail": 50, "institutional": 10, ...}
    
    # 初始事件
    initial_events: List[EventInput] = []
    
    # 交易标的
    symbols: List[str] = ["BTC", "ETH", "SOL"]
    
    # 数据源配置
    use_real_data: bool = True  # 是否使用真实 Coinglass 数据


class SimulationResponse(BaseModel):
    """仿真响应"""
    simulation_id: str
    name: str
    status: str
    created_at: str
    config: Dict


# ============ 健康检查 ============

@router.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "timestamp": datetime.utcnow().isoformat(),
        "version": "0.2.0"
    }


# ============ 人设模板 ============

@router.get("/personas/templates")
async def list_persona_templates():
    """获取预设人设模板"""
    return {
        "templates": {
            name: persona.to_dict()
            for name, persona in PERSONA_TEMPLATES.items()
        }
    }


@router.get("/personas/templates/{template_name}")
async def get_persona_template(template_name: str):
    """获取单个人设模板详情"""
    if template_name not in PERSONA_TEMPLATES:
        raise HTTPException(status_code=404, detail="Template not found")
    
    persona = PERSONA_TEMPLATES[template_name]
    return {
        "template_name": template_name,
        "persona": persona.to_dict(),
        "prompt": persona.to_prompt()
    }


# ============ 仿真管理 ============

@router.post("/simulations", response_model=SimulationResponse)
async def create_simulation(config: SimulationConfig):
    """创建新仿真"""
    sim_id = f"sim_{uuid.uuid4().hex[:12]}"
    
    # 创建仿真引擎
    engine = SimulationEngine(
        start_time=datetime.utcnow(),
        end_time=datetime.utcnow() + timedelta(hours=config.duration_hours),
        interval_hours=config.interval_hours
    )
    
    # 创建事件管理器
    event_manager = EventManager()
    
    # 添加智能体
    agents_created = []
    
    if config.agents:
        # 使用详细配置
        for agent_config in config.agents:
            for i in range(agent_config.count):
                persona = None
                if agent_config.persona_template:
                    persona = create_random_persona(
                        agent_config.agent_type,
                        agent_config.persona_template
                    )
                
                agent = _create_agent(agent_config.agent_type, persona)
                if agent:
                    engine.add_agent(agent)
                    agents_created.append({
                        "type": agent_config.agent_type,
                        "name": agent.name,
                        "persona": persona.to_dict() if persona else None
                    })
    
    elif config.agent_counts:
        # 使用简化配置
        type_mapping = {
            "retail": ("retail_trader", "retail_newbie"),
            "institutional": ("institutional_trader", "institution_fund"),
            "whale": ("whale_trader", "whale_og"),
            "analyst": ("analyst", "analyst_technical"),
            "kol": ("kol", "kol_influencer"),
        }
        
        for key, count in config.agent_counts.items():
            if key in type_mapping:
                agent_type, template = type_mapping[key]
                for i in range(count):
                    persona = create_random_persona(agent_type, template)
                    agent = _create_agent(agent_type, persona)
                    if agent:
                        engine.add_agent(agent)
                        agents_created.append({
                            "type": agent_type,
                            "name": agent.name,
                        })
    
    # 添加初始事件
    for event_input in config.initial_events:
        event = SimulationEvent(
            event_id=uuid.uuid4().hex[:12],
            title=event_input.title,
            content=event_input.content,
            event_type=EventType(event_input.event_type),
            impact=EventImpact(event_input.impact),
            affected_symbols=event_input.affected_symbols,
            sentiment_modifier=event_input.sentiment_modifier,
        )
        event_manager.add_event(event)
    
    # 存储仿真
    active_simulations[sim_id] = {
        "engine": engine,
        "event_manager": event_manager,
        "config": config.dict(),
        "agents": agents_created,
        "created_at": datetime.utcnow().isoformat(),
        "status": "created"
    }
    
    return SimulationResponse(
        simulation_id=sim_id,
        name=config.name,
        status="created",
        created_at=datetime.utcnow().isoformat(),
        config={
            "duration_hours": config.duration_hours,
            "interval_hours": config.interval_hours,
            "symbols": config.symbols,
            "agents_count": len(agents_created),
            "events_count": len(config.initial_events),
        }
    )


def _create_agent(agent_type: str, persona: AgentPersona = None):
    """创建智能体"""
    name = persona.name if persona else None
    
    if agent_type == "retail_trader":
        return RetailTrader(name=name)
    elif agent_type == "institutional_trader":
        return InstitutionalTrader(name=name)
    elif agent_type == "whale_trader":
        return WhaleTrader(name=name)
    elif agent_type == "analyst":
        return AnalystAgent(name=name)
    elif agent_type == "kol":
        return KOLAgent(name=name)
    return None


@router.get("/simulations")
async def list_simulations():
    """列出所有仿真"""
    return [
        {
            "simulation_id": sim_id,
            "name": data["config"].get("name", "未命名"),
            "status": data["status"],
            "created_at": data["created_at"],
            "agents_count": len(data["agents"]),
        }
        for sim_id, data in active_simulations.items()
    ]


@router.get("/simulations/{sim_id}")
async def get_simulation(sim_id: str):
    """获取仿真详情"""
    if sim_id not in active_simulations:
        raise HTTPException(status_code=404, detail="Simulation not found")
    
    data = active_simulations[sim_id]
    engine = data["engine"]
    
    return {
        "simulation_id": sim_id,
        "status": data["status"],
        "config": data["config"],
        "state": engine.get_state(),
        "agents": data["agents"],
        "events": data["event_manager"].to_dict(),
        "recent_history": engine.history[-10:] if engine.history else []
    }


@router.post("/simulations/{sim_id}/events")
async def add_simulation_event(sim_id: str, event: EventInput):
    """向仿真添加事件"""
    if sim_id not in active_simulations:
        raise HTTPException(status_code=404, detail="Simulation not found")
    
    data = active_simulations[sim_id]
    event_manager = data["event_manager"]
    
    sim_event = SimulationEvent(
        event_id=uuid.uuid4().hex[:12],
        title=event.title,
        content=event.content,
        event_type=EventType(event.event_type),
        impact=EventImpact(event.impact),
        affected_symbols=event.affected_symbols,
        sentiment_modifier=event.sentiment_modifier,
    )
    
    event_id = event_manager.add_event(sim_event)
    
    return {"status": "added", "event_id": event_id}


@router.post("/simulations/{sim_id}/events/text")
async def add_text_event(sim_id: str, text: str = Form(...), title: str = Form(None)):
    """从文本添加事件（自动解析）"""
    if sim_id not in active_simulations:
        raise HTTPException(status_code=404, detail="Simulation not found")
    
    data = active_simulations[sim_id]
    event_manager = data["event_manager"]
    
    event_id = event_manager.add_text_event(text, title)
    
    # 获取解析结果
    event = next(e for e in event_manager.events if e.event_id == event_id)
    
    return {
        "status": "added",
        "event_id": event_id,
        "parsed_event": event.to_dict()
    }


@router.post("/simulations/{sim_id}/events/file")
async def add_file_event(sim_id: str, file: UploadFile = File(...)):
    """从文件添加事件"""
    if sim_id not in active_simulations:
        raise HTTPException(status_code=404, detail="Simulation not found")
    
    data = active_simulations[sim_id]
    event_manager = data["event_manager"]
    
    content = await file.read()
    content_str = content.decode("utf-8")
    
    event_ids = event_manager.add_file_events(content_str, file.filename)
    
    return {
        "status": "added",
        "event_count": len(event_ids),
        "event_ids": event_ids
    }


@router.post("/simulations/{sim_id}/start")
async def start_simulation(sim_id: str, background_tasks: BackgroundTasks):
    """启动仿真"""
    if sim_id not in active_simulations:
        raise HTTPException(status_code=404, detail="Simulation not found")
    
    data = active_simulations[sim_id]
    engine = data["engine"]
    
    data["status"] = "running"
    
    async def run_sim():
        await engine.run()
        data["status"] = "completed"
    
    background_tasks.add_task(run_sim)
    
    return {"status": "started", "simulation_id": sim_id}


@router.post("/simulations/{sim_id}/stop")
async def stop_simulation(sim_id: str):
    """停止仿真"""
    if sim_id not in active_simulations:
        raise HTTPException(status_code=404, detail="Simulation not found")
    
    data = active_simulations[sim_id]
    engine = data["engine"]
    
    engine.stop()
    data["status"] = "stopped"
    
    return {"status": "stopped", "simulation_id": sim_id}


@router.get("/simulations/{sim_id}/agents")
async def get_agents(sim_id: str):
    """获取仿真中的智能体"""
    if sim_id not in active_simulations:
        raise HTTPException(status_code=404, detail="Simulation not found")
    
    data = active_simulations[sim_id]
    engine = data["engine"]
    
    return {
        "agents": [a.to_dict() for a in engine.agents],
        "total": len(engine.agents),
        "by_type": {}
    }


@router.get("/simulations/{sim_id}/graph")
async def get_agent_graph(sim_id: str):
    """获取智能体关系图谱数据"""
    if sim_id not in active_simulations:
        raise HTTPException(status_code=404, detail="Simulation not found")
    
    data = active_simulations[sim_id]
    engine = data["engine"]
    
    nodes = []
    for agent in engine.agents:
        color = {
            "retail_trader": "#F85149",
            "institutional_trader": "#3FB950",
            "whale_trader": "#58A6FF",
            "analyst": "#A371F7",
            "kol": "#D29922"
        }.get(agent.agent_type, "#8B949E")
        
        size = {
            "retail_trader": 10,
            "institutional_trader": 20,
            "whale_trader": 30,
            "analyst": 15,
            "kol": 18
        }.get(agent.agent_type, 12)
        
        nodes.append({
            "id": agent.agent_id,
            "label": agent.name[:12],
            "group": agent.agent_type,
            "color": color,
            "size": size
        })
    
    # 从记忆系统构建边（影响关系）
    edges = []
    # 简化：暂时不构建边，后续从 GraphRAG 获取
    
    return {"nodes": nodes, "edges": edges}


@router.get("/market/snapshot")
async def get_market_snapshot():
    """获取当前市场快照"""
    try:
        import os
        api_key = os.getenv("COINGLASS_API_KEY")
        if not api_key:
            return {"error": "COINGLASS_API_KEY not configured"}
        
        service = CoinglassService(api_key=api_key)
        data = await service.get_market_snapshot()
        await service.close()
        return data
    except Exception as e:
        return {"error": str(e)}


# ============ 事件解析工具 ============

@router.post("/events/parse")
async def parse_event_text(text: str = Form(...)):
    """解析事件文本（不添加到仿真）"""
    event = EventParser.parse_text(text)
    return {
        "parsed_event": event.to_dict(),
        "prompt_preview": f"事件：{event.title}\n类型：{event.event_type.value}\n影响：{event.impact.value}\n情绪修正：{event.sentiment_modifier:+.1%}"
    }
