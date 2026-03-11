# QuantWorld

🌐 **多智能体加密货币市场仿真系统**

基于 LLM 的市场预测与分析平台，通过多种类型的智能体协同推演市场走势。

[![GitHub](https://img.shields.io/badge/GitHub-FA--alpha/QuantWorld-blue)](https://github.com/FA-alpha/QuantWorld)

---

## ✨ 功能特点

### 🤖 多智能体系统
- **散户 (Retail)** - 情绪驱动，追涨杀跌
- **机构 (Institutional)** - 理性分析，风险控制
- **巨鲸 (Whale)** - 信息灵通，战略布局
- **分析师 (Analyst)** - 发布研报，影响市场
- **KOL** - 社交喊单，带动情绪

### 🧠 GraphRAG 记忆系统
- 时序图谱存储
- 智能体影响传播
- 因果链追溯
- 市场叙事聚合

### 📊 实时数据接入
- **Coinglass** - 恐惧贪婪/资金费率/清算/OI/ETF
- **Web Search** - 实时新闻
- **支持币种** - BTC, ETH, SOL, DOGE, XRP, ADA, BCH

### 🎨 可视化界面
- 仿真控制台
- 智能体关系图谱
- 实时事件日志
- 仿真报告导出

---

## 🚀 快速开始

### 环境要求
- Python 3.12+
- Node.js 18+
- (可选) Docker

### 安装

```bash
# 克隆仓库
git clone https://github.com/FA-alpha/QuantWorld.git
cd QuantWorld

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入 API Keys

# 启动
./run.sh
```

### Docker 启动

```bash
docker-compose up -d
```

访问:
- 前端: http://localhost:3000
- API: http://localhost:8000
- API 文档: http://localhost:8000/docs

---

## 📁 项目结构

```
QuantWorld/
├── backend/
│   ├── agents/           # 智能体定义
│   │   ├── base.py       # 基类
│   │   ├── trader.py     # 交易者
│   │   └── influencer.py # 影响者
│   ├── services/
│   │   ├── coinglass.py  # 数据服务
│   │   ├── simulation.py # 仿真引擎
│   │   ├── memory.py     # GraphRAG
│   │   └── llm.py        # LLM 服务
│   └── api/
│       ├── main.py       # FastAPI
│       └── routes.py     # API 路由
├── frontend/
│   ├── src/
│   │   ├── components/   # UI 组件
│   │   ├── pages/        # 页面
│   │   ├── hooks/        # React Hooks
│   │   └── services/     # API 客户端
│   └── package.json
├── docs/
│   ├── REQUIREMENTS.md   # 需求文档
│   ├── ARCHITECTURE.md   # 架构文档
│   └── AGENT_DESIGN.md   # 智能体设计
├── Dockerfile
├── docker-compose.yml
└── run.sh
```

---

## 🔧 配置

### 环境变量

| 变量 | 说明 | 必需 |
|------|------|------|
| `COINGLASS_API_KEY` | Coinglass API Key | ✅ |
| `OPENROUTER_API_KEY` | OpenRouter API Key | 可选 |

---

## 📖 API 文档

### REST API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| POST | `/api/simulations` | 创建仿真 |
| GET | `/api/simulations` | 列表 |
| POST | `/api/simulations/{id}/start` | 启动 |
| POST | `/api/simulations/{id}/stop` | 停止 |
| GET | `/api/simulations/{id}/agents` | 智能体列表 |
| GET | `/api/simulations/{id}/graph` | 关系图谱 |
| GET | `/api/market/snapshot` | 市场快照 |

### WebSocket

```
ws://localhost:8000/ws/simulation/{sim_id}
```

---

## 📊 仿真流程

```
1. 配置仿真参数（时长、智能体数量、币种）
2. 系统初始化智能体和记忆图谱
3. 每个时间步 (1h):
   a. 获取市场数据 (Coinglass)
   b. 智能体感知 → 决策 → 行动
   c. 影响传播 (分析师→散户, KOL→散户)
   d. 记录到 GraphRAG
4. 生成仿真报告
```

---

## 📜 License

MIT

---

## 🙏 致谢

- [MiroFish](https://github.com/666ghj/MiroFish) - 界面参考
- [Coinglass](https://www.coinglass.com/) - 数据接口
