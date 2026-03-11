#!/usr/bin/env python3
"""
QuantWorld 仿真测试
"""

import asyncio
import sys
sys.path.insert(0, '.')

from backend.agents.trader import RetailTrader, InstitutionalTrader, WhaleTrader
from backend.agents.influencer import AnalystAgent, KOLAgent
from backend.services.simulation import SimulationEngine
from datetime import datetime, timedelta


async def main():
    print("🚀 启动 QuantWorld 仿真测试")
    print("=" * 50)
    
    # 创建仿真引擎（1小时间隔，24小时仿真）
    engine = SimulationEngine(
        start_time=datetime.utcnow(),
        end_time=datetime.utcnow() + timedelta(hours=24),
        interval_hours=1
    )
    
    # 添加智能体
    print("\n📊 添加智能体:")
    
    # 散户
    for i in range(10):
        engine.add_agent(RetailTrader(f"散户_{i+1}"))
    print(f"  - 散户: 10")
    
    # 机构
    for i in range(3):
        engine.add_agent(InstitutionalTrader(f"机构_{i+1}"))
    print(f"  - 机构: 3")
    
    # 巨鲸
    engine.add_agent(WhaleTrader("巨鲸_Alpha"))
    print(f"  - 巨鲸: 1")
    
    # 分析师
    engine.add_agent(AnalystAgent("技术分析师", specialty="technical"))
    engine.add_agent(AnalystAgent("链上分析师", specialty="onchain"))
    print(f"  - 分析师: 2")
    
    # KOL
    engine.add_agent(KOLAgent("加密KOL_1", platform="twitter"))
    print(f"  - KOL: 1")
    
    print(f"\n总计: {len(engine.agents)} 个智能体")
    
    # 运行仿真
    print("\n⏱️ 开始仿真 (24 个时间步)...\n")
    
    tick_count = 0
    action_count = 0
    
    async def on_tick(tick_result):
        nonlocal tick_count, action_count
        tick_count += 1
        actions = tick_result.get("agent_actions", [])
        action_count += len(actions)
        
        fear_greed = tick_result.get("market_data", {}).get("fear_greed", {}).get("value", 50)
        
        print(f"Tick {tick_count:2d} | 恐惧贪婪: {fear_greed:2d} | 动作: {len(actions):2d} | 总记忆: {tick_result.get('memory_stats', {}).get('total_memories', 0)}")
        
        for action in actions[:3]:  # 只显示前3个动作
            agent_type = action.get("agent_type", "unknown").replace("_trader", "")
            print(f"         └─ [{agent_type}] {action.get('action', 'hold').upper()} {action.get('symbol', '')} - {action.get('reason', '')[:30]}")
    
    await engine.run(callback=on_tick)
    
    # 汇总
    print("\n" + "=" * 50)
    print("📈 仿真完成!")
    print(f"  - 总时间步: {tick_count}")
    print(f"  - 总交易动作: {action_count}")
    
    # 显示市场叙事
    narrative = engine.get_narrative(limit=5)
    if narrative:
        print("\n🗞️ 市场叙事 (最近5条):")
        for event in narrative:
            print(f"  - {event.get('content', '')[:50]}")
    
    # 显示记忆统计
    state = engine.get_state()
    print(f"\n🧠 记忆图谱统计:")
    for agent_id, stats in list(state.get("memory_summary", {}).items())[:5]:
        print(f"  - {agent_id}: {stats['nodes']} 节点, {stats['edges']} 边")


if __name__ == "__main__":
    asyncio.run(main())
