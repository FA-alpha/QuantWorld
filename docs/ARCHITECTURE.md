# 系统架构设计

## 1. 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        QuantWorld                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   数据层      │  │   仿真层     │  │   输出层      │      │
│  │              │  │              │  │              │       │
│  │ • 行情数据   │→│ • 智能体引擎 │→│ • 情绪报告   │       │
│  │ • 新闻数据   │  │ • 市场模拟   │  │ • 预测输出   │       │
│  │ • 历史数据   │  │ • 交互协调   │  │ • 日志回放   │       │
│  │              │  │              │  │              │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 模块设计

### 2.1 数据层（Data Layer）

```python
# data/fetcher.py
class DataFetcher:
    """统一数据获取接口"""
    
    def get_realtime_price(self, symbol: str) -> dict:
        """获取实时价格"""
        pass
    
    def get_klines(self, symbol: str, interval: str, limit: int) -> list:
        """获取 K 线数据"""
        pass
    
    def get_indicators(self, symbol: str) -> dict:
        """获取技术指标"""
        pass
```

```python
# data/feeds.py
class OKXFeed:
    """OKX 交易所数据源"""
    base_url = "https://www.okx.com/api/v5"
    
class BinanceFeed:
    """Binance 数据源"""
    base_url = "https://api.binance.com/api/v3"
```

### 2.2 智能体层（Agent Layer）

```python
# agents/manager.py
class AgentManager:
    """智能体管理器"""
    
    def __init__(self, config: dict):
        self.agents = {}
        self.llm_client = OpenRouterClient(config['api_key'])
    
    def create_agents(self, agent_configs: list):
        """批量创建智能体"""
        pass
    
    def run_step(self, market_state: dict) -> list:
        """执行一个时间步"""
        decisions = []
        for agent in self.agents.values():
            observation = agent.observe(market_state)
            decision = agent.decide(observation)
            decisions.append(decision)
        return decisions
```

### 2.3 市场层（Market Layer）

```python
# market/engine.py
class MarketEngine:
    """市场模拟引擎"""
    
    def __init__(self, initial_price: float):
        self.price = initial_price
        self.orderbook = OrderBook()
    
    def process_decisions(self, decisions: list) -> dict:
        """处理所有智能体决策，更新市场状态"""
        buy_volume = sum(d['amount'] for d in decisions if d['action'] == 'buy')
        sell_volume = sum(d['amount'] for d in decisions if d['action'] == 'sell')
        
        # 简化的价格影响模型
        price_impact = (buy_volume - sell_volume) / (buy_volume + sell_volume + 1) * 0.01
        self.price *= (1 + price_impact)
        
        return {
            'price': self.price,
            'volume': buy_volume + sell_volume,
            'price_change': price_impact
        }
```

### 2.4 协调层（Orchestrator）

```python
# core/orchestrator.py
class SimulationOrchestrator:
    """仿真协调器 - 核心控制循环"""
    
    def __init__(self, config: dict):
        self.data_fetcher = DataFetcher(config)
        self.agent_manager = AgentManager(config)
        self.market_engine = MarketEngine(config['initial_price'])
        self.reporter = Reporter()
        self.step = 0
    
    def run(self, steps: int):
        """运行仿真"""
        for _ in range(steps):
            self.step += 1
            
            # 1. 获取市场数据
            market_state = self.data_fetcher.get_market_state()
            
            # 2. 注入事件（如有）
            event = self.event_generator.maybe_generate()
            if event:
                market_state['event'] = event
            
            # 3. 智能体决策
            decisions = self.agent_manager.run_step(market_state)
            
            # 4. 更新市场
            new_state = self.market_engine.process_decisions(decisions)
            
            # 5. 记录日志
            self.reporter.log_step(self.step, decisions, new_state)
        
        # 生成报告
        return self.reporter.generate_report()
```

---

## 3. LLM 调用设计

### 3.1 批量调用优化

```python
class LLMBatcher:
    """批量 LLM 调用，减少延迟和成本"""
    
    def __init__(self, client):
        self.client = client
        self.queue = []
    
    async def batch_complete(self, prompts: list) -> list:
        """并行调用多个智能体"""
        tasks = [self.client.complete(p) for p in prompts]
        return await asyncio.gather(*tasks)
```

### 3.2 模型选择策略

```python
MODEL_CONFIGS = {
    'retail': {
        'model': 'qwen/qwen-2.5-7b-instruct',  # 轻量模型
        'max_tokens': 200
    },
    'quant': {
        'model': 'qwen/qwen-2.5-7b-instruct',
        'max_tokens': 300
    },
    'whale': {
        'model': 'anthropic/claude-3-haiku',  # 较强模型
        'max_tokens': 500
    },
    'kol': {
        'model': 'anthropic/claude-3-haiku',
        'max_tokens': 500
    }
}
```

---

## 4. 配置设计

```yaml
# config/default.yaml
simulation:
  symbol: "BTC-USDT"
  steps: 100
  interval: "1m"

agents:
  retail:
    - type: optimistic
      name: "乐观散户A"
      initial_cash: 10000
    - type: panic
      name: "恐慌散户B"
      initial_cash: 10000
    - type: neutral
      name: "中性散户C"
      initial_cash: 10000
  
  quant:
    - name: "量化1号"
      initial_cash: 50000
      indicators: ["ma", "rsi", "macd"]
  
  whale:
    - name: "巨鲸"
      initial_cash: 500000
  
  kol:
    - name: "分析师张三"
      followers: 100000

llm:
  provider: "openrouter"
  api_key: "${OPENROUTER_API_KEY}"
  default_model: "qwen/qwen-2.5-7b-instruct"

data:
  exchange: "okx"
  feeds:
    - realtime_price
    - klines_1m
```

---

## 5. 目录结构

```
QuantWorld/
├── README.md
├── requirements.txt
├── .env.example
├── main.py                     # 入口
│
├── config/
│   ├── default.yaml            # 默认配置
│   └── agents.yaml             # 智能体配置
│
├── core/
│   ├── __init__.py
│   ├── orchestrator.py         # 仿真协调器
│   └── events.py               # 事件生成器
│
├── agents/
│   ├── __init__.py
│   ├── base.py                 # 基类
│   ├── retail.py               # 散户
│   ├── quant.py                # 量化
│   ├── whale.py                # 巨鲸
│   ├── kol.py                  # KOL
│   └── manager.py              # 管理器
│
├── market/
│   ├── __init__.py
│   ├── engine.py               # 市场引擎
│   ├── orderbook.py            # 订单簿
│   └── price.py                # 价格模型
│
├── data/
│   ├── __init__.py
│   ├── fetcher.py              # 数据获取
│   └── feeds/
│       ├── okx.py
│       └── binance.py
│
├── llm/
│   ├── __init__.py
│   ├── client.py               # LLM 客户端
│   └── batcher.py              # 批量调用
│
├── output/
│   ├── __init__.py
│   ├── reporter.py             # 报告生成
│   └── templates/              # 报告模板
│
├── utils/
│   ├── __init__.py
│   └── logger.py
│
├── tests/
│   └── ...
│
└── docs/
    ├── REQUIREMENTS.md
    ├── ARCHITECTURE.md
    └── AGENT_DESIGN.md
```

---

## 6. 部署架构

### 6.1 开发环境
```
本地 Python + OKX API + OpenRouter
```

### 6.2 生产环境
```
VPS/Cloud → Python Service → OKX API
                          → OpenRouter
                          → Redis (可选)
                          → PostgreSQL (可选)
```

---

## 更新日志

| 日期 | 版本 | 修改内容 |
|------|------|---------|
| 2026-03-10 | v0.1 | 初始架构设计 |
