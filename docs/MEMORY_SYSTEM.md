# QuantWorld 记忆系统设计

## 概述

使用 **时序 GraphRAG** 作为智能体记忆系统的核心，关键特性：
- **时间有序**：所有记忆按时间排序，智能体只能访问"过去"的信息
- **因果完整**：保留事件的因果链和时间先后关系
- **推演正确**：确保仿真时不会出现"未来信息泄露"

---

## 1. 时序记忆的核心原则

### 1.1 时间隔离（Critical）

```
❌ 错误：智能体在 T=5 时访问 T=10 的信息
✅ 正确：智能体在 T=5 时只能访问 T<=5 的信息
```

### 1.2 时间戳强制

**所有节点和关系必须有时间戳**：

```python
class TemporalNode:
    """时序节点基类"""
    id: str
    timestamp: datetime      # 创建时间（必填）
    valid_from: datetime     # 生效开始时间
    valid_to: datetime       # 生效结束时间（可选，None 表示仍有效）
```

### 1.3 时间窗口查询

```python
def query_at_time(self, query: str, as_of: datetime) -> list:
    """
    查询截止到指定时间点的信息
    
    关键：过滤掉 timestamp > as_of 的所有节点和关系
    """
    pass
```

---

## 2. 时序图谱结构

### 2.1 节点设计（带时间戳）

```python
@dataclass
class Agent:
    """智能体节点"""
    id: str
    type: str               # retail | quant | whale | kol | analyst | news
    name: str
    created_at: datetime    # 创建时间
    
@dataclass  
class Event:
    """事件节点"""
    id: str
    type: str               # market | news | trade | analysis
    timestamp: datetime     # 事件发生时间（关键！）
    content: str
    sentiment: str
    source: str             # 来源智能体 ID
    
@dataclass
class Decision:
    """决策节点"""
    id: str
    agent_id: str
    timestamp: datetime     # 决策时间（关键！）
    step: int               # 仿真步数
    action: str             # buy | sell | hold
    symbol: str
    amount: float
    price: float
    reason: str
    confidence: float
    based_on: list[str]     # 基于哪些事件 ID

@dataclass
class MarketState:
    """市场状态快照"""
    id: str
    timestamp: datetime     # 快照时间
    step: int               # 仿真步数
    symbol: str
    price: float
    volume: float
    indicators: dict
```

### 2.2 关系设计（带时间戳）

```python
@dataclass
class Relationship:
    """时序关系"""
    id: str
    from_id: str
    to_id: str
    type: str               # OBSERVES | DECIDES | INFLUENCES | TRIGGERS
    timestamp: datetime     # 关系建立时间
    weight: float           # 关系强度（可选）
    context: str            # 上下文描述
```

---

## 3. 时序记忆 API

### 3.1 写入（自动添加时间戳）

```python
class TemporalMemorySystem:
    """时序记忆系统"""
    
    def __init__(self):
        self.graph = GraphRAG(...)
        self.current_step = 0
        self.current_time = None
    
    def set_simulation_time(self, step: int, timestamp: datetime):
        """设置当前仿真时间（每个时间步开始时调用）"""
        self.current_step = step
        self.current_time = timestamp
    
    def record_event(self, event: dict) -> str:
        """记录事件"""
        event['timestamp'] = self.current_time
        event['step'] = self.current_step
        return self.graph.add_node('Event', event)
    
    def record_decision(self, agent_id: str, decision: dict) -> str:
        """记录决策"""
        decision['timestamp'] = self.current_time
        decision['step'] = self.current_step
        decision['agent_id'] = agent_id
        
        node_id = self.graph.add_node('Decision', decision)
        
        # 创建 DECIDES 关系
        self.graph.add_relationship(
            from_id=agent_id,
            to_id=node_id,
            type='DECIDES',
            timestamp=self.current_time
        )
        
        # 创建 BASED_ON 关系（如果有）
        for event_id in decision.get('based_on', []):
            self.graph.add_relationship(
                from_id=node_id,
                to_id=event_id,
                type='BASED_ON',
                timestamp=self.current_time
            )
        
        return node_id
```

### 3.2 时序查询（关键！）

```python
class TemporalMemorySystem:
    
    def query_events_before(self, timestamp: datetime, limit: int = 10) -> list:
        """查询指定时间之前的事件"""
        return self.graph.query(
            "MATCH (e:Event) WHERE e.timestamp <= $ts RETURN e ORDER BY e.timestamp DESC LIMIT $limit",
            params={'ts': timestamp, 'limit': limit}
        )
    
    def query_agent_history_at(self, agent_id: str, as_of: datetime, limit: int = 5) -> list:
        """查询智能体在指定时间点之前的历史决策"""
        return self.graph.query("""
            MATCH (a:Agent {id: $agent_id})-[:DECIDES]->(d:Decision)
            WHERE d.timestamp <= $as_of
            RETURN d ORDER BY d.timestamp DESC LIMIT $limit
        """, params={'agent_id': agent_id, 'as_of': as_of, 'limit': limit})
    
    def query_influences_at(self, agent_id: str, as_of: datetime) -> list:
        """查询指定时间点之前影响该智能体的其他智能体"""
        return self.graph.query("""
            MATCH (other:Agent)-[r:INFLUENCES]->(a:Agent {id: $agent_id})
            WHERE r.timestamp <= $as_of
            RETURN other, r ORDER BY r.timestamp DESC
        """, params={'agent_id': agent_id, 'as_of': as_of})
    
    def query_causal_chain_at(self, event_id: str, as_of: datetime) -> dict:
        """查询事件的因果链（仅限时间之前的）"""
        return self.graph.query("""
            MATCH path = (e1:Event)-[:TRIGGERS*1..5]->(e2:Event {id: $event_id})
            WHERE ALL(n IN nodes(path) WHERE n.timestamp <= $as_of)
            RETURN path
        """, params={'event_id': event_id, 'as_of': as_of})
```

---

## 4. 仿真循环中的时序保证

### 4.1 仿真主循环

```python
class SimulationOrchestrator:
    def run(self, start_time: datetime, steps: int, interval_hours: int = 1):
        current_time = start_time
        
        for step in range(steps):
            # 1. 设置当前仿真时间
            self.memory.set_simulation_time(step, current_time)
            
            # 2. 获取截止到当前时间的市场数据
            market_state = self.data_fetcher.get_state_at(current_time)
            
            # 3. 各智能体观察和决策（只能访问 <= current_time 的信息）
            for agent in self.agents:
                # 智能体只能查询当前时间之前的记忆
                observation = agent.observe(market_state, as_of=current_time)
                decision = agent.decide(observation, as_of=current_time)
                
                # 记录决策（自动带上 current_time）
                self.memory.record_decision(agent.id, decision)
            
            # 4. 推进时间
            current_time += timedelta(hours=interval_hours)
```

### 4.2 智能体决策（时间感知）

```python
class BaseAgent:
    def decide(self, observation: dict, as_of: datetime) -> dict:
        """
        做出决策
        
        关键：所有记忆查询必须传入 as_of 参数
        """
        # 查询自己的历史（只到 as_of）
        my_history = self.memory.query_agent_history_at(
            self.id, 
            as_of=as_of, 
            limit=5
        )
        
        # 查询影响我的智能体的观点（只到 as_of）
        influences = self.memory.query_influences_at(self.id, as_of=as_of)
        
        # 查询最近事件（只到 as_of）
        recent_events = self.memory.query_events_before(as_of, limit=10)
        
        # 构建 prompt 并决策
        prompt = self.build_prompt(observation, my_history, influences, recent_events)
        decision = self.llm.complete(prompt)
        
        return decision
```

---

## 5. 时序数据存储

### 5.1 推荐存储方案

| 方案 | 说明 | 适用场景 |
|------|------|---------|
| **Neo4j + 时间属性** | 在节点/关系上存储时间戳，查询时过滤 | 推荐，功能完整 |
| TimescaleDB + GraphRAG | 时序数据库 + 图谱 | 高频数据场景 |
| SQLite + NetworkX | 轻量级，关系存 SQLite，图用 NetworkX | MVP 快速验证 |

### 5.2 Neo4j 时序查询优化

```cypher
-- 创建时间索引
CREATE INDEX event_time FOR (e:Event) ON (e.timestamp);
CREATE INDEX decision_time FOR (d:Decision) ON (d.timestamp);

-- 时序范围查询
MATCH (e:Event)
WHERE e.timestamp >= datetime('2026-01-01T00:00:00')
  AND e.timestamp < datetime('2026-01-02T00:00:00')
RETURN e ORDER BY e.timestamp;
```

---

## 6. 时间回溯功能

### 6.1 回放任意时间点

```python
def replay_at(self, target_time: datetime) -> dict:
    """
    回放到指定时间点的世界状态
    
    返回：该时间点所有智能体的状态、最近决策、市场状态
    """
    # 查询该时间点的市场状态
    market = self.memory.query("""
        MATCH (m:MarketState)
        WHERE m.timestamp <= $target
        RETURN m ORDER BY m.timestamp DESC LIMIT 1
    """, params={'target': target_time})
    
    # 查询各智能体在该时间点的最新决策
    agent_states = {}
    for agent in self.agents:
        last_decision = self.memory.query_agent_history_at(
            agent.id, 
            as_of=target_time, 
            limit=1
        )
        agent_states[agent.id] = last_decision
    
    return {
        'time': target_time,
        'market': market,
        'agents': agent_states
    }
```

### 6.2 因果追溯（时序正确）

```python
def trace_cause(self, event_id: str, max_depth: int = 5) -> list:
    """
    追溯事件的因果链
    
    保证：返回的所有事件按时间排序，且因->果的时间关系正确
    """
    event = self.memory.get_event(event_id)
    event_time = event['timestamp']
    
    # 只查询时间在该事件之前的因
    causes = self.memory.query("""
        MATCH path = (cause:Event)-[:TRIGGERS*1..{max_depth}]->(effect:Event {{id: $eid}})
        WHERE cause.timestamp < $event_time
        RETURN path
    """, params={'eid': event_id, 'event_time': event_time, 'max_depth': max_depth})
    
    return sorted(causes, key=lambda x: x['timestamp'])
```

---

## 7. 总结：时序保证清单

| 检查项 | 说明 |
|--------|------|
| ✅ 所有节点有 timestamp | 强制字段 |
| ✅ 所有关系有 timestamp | 强制字段 |
| ✅ 查询接口强制 as_of 参数 | 防止访问未来 |
| ✅ 仿真循环维护 current_time | 时间推进 |
| ✅ 智能体决策传入 as_of | 时间感知 |
| ✅ 因果链查询校验时序 | 因在果之前 |
| ✅ 时间索引优化查询 | 性能保证 |

---

## 更新日志

| 日期 | 版本 | 修改内容 |
|------|------|---------|
| 2026-03-10 | v0.1 | 初始设计 |
| 2026-03-10 | v0.2 | 强调时序特性，添加时间隔离、时序查询、时间回溯 |
