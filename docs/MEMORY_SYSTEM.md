# QuantWorld 记忆系统设计

## 概述

使用 GraphRAG 作为智能体记忆系统的核心，构建一个持久化的知识图谱，记录：
- 每个智能体的观察、决策、交互历史
- 智能体之间的关系和影响
- 市场事件和因果链

---

## 1. 为什么使用 GraphRAG

### 传统向量数据库的局限

| 问题 | 说明 |
|------|------|
| 缺乏关系 | 不能表达"A 影响了 B"的关系 |
| 无法推理 | 只能检索相似内容，不能做因果推理 |
| 孤立记忆 | 每个智能体的记忆相互独立 |

### GraphRAG 的优势

| 优势 | 说明 |
|------|------|
| **关系建模** | 可以表达"KOL 发言 → 散户跟单"的因果关系 |
| **多跳推理** | 可以查询"是什么导致了价格下跌" |
| **全局视图** | 整个仿真世界共享一个知识图谱 |
| **社区发现** | 自动发现智能体群体和行为模式 |

---

## 2. 记忆图谱结构

### 2.1 节点类型（Entities）

```
Agent（智能体）
├── id: string
├── type: retail | quant | whale | kol | analyst | news
├── name: string
├── personality: string  # 人设描述
└── state: json         # 当前状态（持仓、资金等）

Event（事件）
├── id: string
├── type: market | news | trade | analysis
├── timestamp: datetime
├── content: string
└── sentiment: bullish | bearish | neutral

Decision（决策）
├── id: string
├── agent_id: string
├── timestamp: datetime
├── action: buy | sell | hold
├── symbol: string
├── amount: float
├── reason: string
└── confidence: float

MarketState（市场状态）
├── id: string
├── timestamp: datetime
├── symbol: string
├── price: float
├── volume: float
└── indicators: json
```

### 2.2 关系类型（Relationships）

```
OBSERVES: Agent → Event
# 智能体观察到某个事件

DECIDES: Agent → Decision
# 智能体做出某个决策

INFLUENCES: Agent → Agent
# 智能体 A 影响了智能体 B

TRIGGERS: Event → Event
# 事件 A 触发了事件 B

CAUSES: Decision → MarketState
# 决策导致了市场状态变化

BASED_ON: Decision → Event
# 决策基于某个事件

FOLLOWS: Agent → Agent
# 散户关注某个 KOL
```

### 2.3 图谱示例

```
         ┌─────────────┐
         │  新闻事件    │
         │ "ETF 通过"  │
         └──────┬──────┘
                │ OBSERVES
                ▼
         ┌─────────────┐
         │    KOL      │──────INFLUENCES────→┌─────────────┐
         │   发布分析   │                      │   散户 A    │
         └──────┬──────┘                      └──────┬──────┘
                │ DECIDES                            │ DECIDES
                ▼                                    ▼
         ┌─────────────┐                      ┌─────────────┐
         │  买入 BTC   │                      │  跟单买入   │
         │  0.5 @ 85k  │                      │  0.1 @ 85k  │
         └─────────────┘                      └─────────────┘
```

---

## 3. GraphRAG 技术选型

### 3.1 推荐方案：Microsoft GraphRAG

```python
# 使用 Microsoft 开源的 GraphRAG
# https://github.com/microsoft/graphrag

from graphrag import GraphRAG

# 初始化
graph = GraphRAG(
    storage_path="./data/graph",
    llm_config={
        "model": "gpt-4o-mini",
        "api_key": "..."
    }
)

# 索引文档
graph.index(documents=[...])

# 查询
result = graph.query("什么导致了 BTC 价格下跌？")
```

### 3.2 备选方案

| 方案 | 优点 | 缺点 |
|------|------|------|
| Neo4j + LangChain | 成熟稳定 | 需要单独部署数据库 |
| LlamaIndex GraphRAG | 轻量级 | 功能相对简单 |
| 自研（NetworkX + 向量库） | 完全可控 | 开发工作量大 |

---

## 4. 记忆系统 API

### 4.1 写入记忆

```python
class MemorySystem:
    """基于 GraphRAG 的记忆系统"""
    
    def record_observation(self, agent_id: str, event: dict):
        """记录智能体的观察"""
        # 创建 Event 节点
        # 创建 OBSERVES 关系
        pass
    
    def record_decision(self, agent_id: str, decision: dict):
        """记录智能体的决策"""
        # 创建 Decision 节点
        # 创建 DECIDES 关系
        # 如果基于某个 Event，创建 BASED_ON 关系
        pass
    
    def record_influence(self, from_agent: str, to_agent: str, context: str):
        """记录智能体之间的影响关系"""
        # 创建/更新 INFLUENCES 关系
        pass
    
    def record_market_state(self, state: dict):
        """记录市场状态快照"""
        pass
```

### 4.2 查询记忆

```python
class MemorySystem:
    
    def query_agent_history(self, agent_id: str, limit: int = 10) -> list:
        """查询智能体的历史决策"""
        pass
    
    def query_influences(self, agent_id: str) -> list:
        """查询影响该智能体的其他智能体"""
        pass
    
    def query_causal_chain(self, event_id: str) -> dict:
        """查询事件的因果链"""
        # 使用 GraphRAG 的多跳推理能力
        pass
    
    def query_global(self, question: str) -> str:
        """全局查询（如"最近市场为什么下跌"）"""
        # 使用 GraphRAG 的 global search
        pass
    
    def query_local(self, agent_id: str, question: str) -> str:
        """从特定智能体视角查询"""
        # 使用 GraphRAG 的 local search
        pass
```

---

## 5. 智能体与记忆的交互

### 5.1 决策时查询记忆

```python
class BaseAgent:
    def decide(self, market_state: dict) -> dict:
        # 1. 查询自己的历史决策
        my_history = self.memory.query_agent_history(self.id, limit=5)
        
        # 2. 查询影响我的智能体的最新观点
        influences = self.memory.query_influences(self.id)
        recent_opinions = [
            self.memory.query_agent_history(inf['agent_id'], limit=1)
            for inf in influences
        ]
        
        # 3. 查询相关事件
        events = self.memory.query_local(self.id, f"最近关于 {symbol} 的重要事件")
        
        # 4. 构建 prompt，调用 LLM 决策
        prompt = self.build_prompt(market_state, my_history, recent_opinions, events)
        decision = self.llm.complete(prompt)
        
        # 5. 记录决策到记忆
        self.memory.record_decision(self.id, decision)
        
        return decision
```

### 5.2 散户观察 KOL

```python
class RetailTrader(BaseAgent):
    def observe(self, market_state: dict):
        # 查询关注的 KOL 的最新分析
        kol_opinions = self.memory.query(
            f"我关注的 KOL 最近对 {self.watching_symbols} 的分析"
        )
        
        # 记录观察
        for opinion in kol_opinions:
            self.memory.record_observation(self.id, opinion)
        
        return {
            'market': market_state,
            'kol_opinions': kol_opinions
        }
```

---

## 6. 前端可视化

### 6.1 关系图谱展示

基于 GraphRAG 的知识图谱生成前端可视化：

```javascript
// 使用 vis.js 或 cytoscape.js 展示

// 节点：智能体、事件、决策
// 边：观察、影响、决策、触发
// 颜色：按类型/情绪着色
// 动画：实时更新图谱
```

### 6.2 因果链追溯

用户可以点击任意事件，查看：
- 是什么导致了它？
- 它导致了什么？
- 哪些智能体参与了？

---

## 7. 实现计划

| 阶段 | 内容 | 时间 |
|------|------|------|
| Phase 1 | 集成 Microsoft GraphRAG | 3 天 |
| Phase 2 | 实现记忆 API | 2 天 |
| Phase 3 | 智能体集成 | 3 天 |
| Phase 4 | 前端图谱可视化 | 3 天 |

---

## 更新日志

| 日期 | 版本 | 修改内容 |
|------|------|---------|
| 2026-03-10 | v0.1 | 初始记忆系统设计 |
