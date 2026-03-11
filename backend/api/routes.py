"""
API 路由定义
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import uuid
import asyncio

from backend.agents.trader import RetailTrader, InstitutionalTrader, WhaleTrader
from backend.services.simulation import SimulationEngine
from backend.services.coinglass import CoinglassService

router = APIRouter(prefix="/api")

# 存储活跃的仿真
active_simulations: Dict[str, SimulationEngine] = {}


class SimulationConfig(BaseModel):
    """仿真配置"""
    name: str = "新仿真"
    duration_hours: int = 168  # 7天
    interval_hours: int = 1
    agents: Dict[str, int] = {"retail": 50, "institutional": 10, "whale": 3}
    symbols: List[str] = ["BTC", "ETH", "SOL"]


class SimulationResponse(BaseModel):
    """仿真响应"""
    simulation_id: str
    name: str
    status: str
    created_at: str
    config: SimulationConfig


@router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


@router.post("/simulations", response_model=SimulationResponse)
async def create_simulation(config: SimulationConfig, background_tasks: BackgroundTasks):
    """创建新仿真"""
    sim_id = f"sim_{uuid.uuid4().hex[:12]}"
    
    # 创建仿真引擎
    engine = SimulationEngine(
        start_time=datetime.utcnow(),
        end_time=datetime.utcnow() + timedelta(hours=config.duration_hours),
        interval_hours=config.interval_hours
    )
    
    # 添加智能体
    for i in range(config.agents.get("retail", 0)):
        engine.add_agent(RetailTrader())
    
    for i in range(config.agents.get("institutional", 0)):
        engine.add_agent(InstitutionalTrader())
    
    for i in range(config.agents.get("whale", 0)):
        engine.add_agent(WhaleTrader())
    
    active_simulations[sim_id] = engine
    
    return SimulationResponse(
        simulation_id=sim_id,
        name=config.name,
        status="created",
        created_at=datetime.utcnow().isoformat(),
        config=config
    )


@router.get("/simulations")
async def list_simulations():
    """列出所有仿真"""
    return [
        {
            "simulation_id": sim_id,
            "state": engine.get_state()
        }
        for sim_id, engine in active_simulations.items()
    ]


@router.get("/simulations/{sim_id}")
async def get_simulation(sim_id: str):
    """获取仿真详情"""
    engine = active_simulations.get(sim_id)
    if not engine:
        raise HTTPException(status_code=404, detail="Simulation not found")
    
    return {
        "simulation_id": sim_id,
        "state": engine.get_state(),
        "recent_events": engine.events[-20:] if engine.events else []
    }


@router.post("/simulations/{sim_id}/start")
async def start_simulation(sim_id: str, background_tasks: BackgroundTasks):
    """启动仿真"""
    engine = active_simulations.get(sim_id)
    if not engine:
        raise HTTPException(status_code=404, detail="Simulation not found")
    
    # 在后台运行
    async def run_sim():
        await engine.run()
    
    background_tasks.add_task(run_sim)
    
    return {"status": "started", "simulation_id": sim_id}


@router.post("/simulations/{sim_id}/stop")
async def stop_simulation(sim_id: str):
    """停止仿真"""
    engine = active_simulations.get(sim_id)
    if not engine:
        raise HTTPException(status_code=404, detail="Simulation not found")
    
    engine.stop()
    return {"status": "stopped", "simulation_id": sim_id}


@router.get("/simulations/{sim_id}/agents")
async def get_agents(sim_id: str):
    """获取仿真中的智能体"""
    engine = active_simulations.get(sim_id)
    if not engine:
        raise HTTPException(status_code=404, detail="Simulation not found")
    
    return {
        "agents": [a.to_dict() for a in engine.agents],
        "total": len(engine.agents)
    }


@router.get("/simulations/{sim_id}/graph")
async def get_agent_graph(sim_id: str):
    """获取智能体关系图谱数据"""
    engine = active_simulations.get(sim_id)
    if not engine:
        raise HTTPException(status_code=404, detail="Simulation not found")
    
    # 构建节点和边
    nodes = []
    edges = []
    
    for agent in engine.agents:
        color = {
            "retail_trader": "#F85149",
            "institutional_trader": "#3FB950",
            "whale_trader": "#58A6FF"
        }.get(agent.agent_type, "#8B949E")
        
        nodes.append({
            "id": agent.agent_id,
            "label": agent.name[:10],
            "group": agent.agent_type,
            "color": color,
            "size": 10 if agent.agent_type == "retail_trader" else (20 if agent.agent_type == "institutional_trader" else 30)
        })
    
    # 基于交易关系构建边（简化版）
    # 实际项目中这里会用 GraphRAG 分析智能体间的影响关系
    for event in engine.events:
        if event.get("type") == "agent_action":
            # 找到同时期其他有类似动作的智能体，建立关联
            pass
    
    return {
        "nodes": nodes,
        "edges": edges
    }


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
