# QuantWorld

基于多智能体技术的加密货币/美股交易预测仿真系统

## 🎯 项目概述

QuantWorld 是一个利用多智能体（Multi-Agent）技术构建的交易市场仿真系统。通过模拟真实市场中的各类参与者行为，预测市场情绪演化和价格趋势。

### 核心理念

- **群体智能涌现**：不是单个 AI 预测，而是通过多个智能体交互产生涌现现象
- **行为仿真**：模拟散户、机构、量化基金等不同角色的交易行为
- **情绪传导**：模拟信息在市场参与者之间的传播和情绪演化

---

## 📋 需求文档

详细需求请查看 [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md)

---

## 🏗️ 技术架构

详细架构请查看 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

---

## 🚀 快速开始

```bash
# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入 API Key

# 启动仿真
python main.py
```

---

## 📁 项目结构

```
QuantWorld/
├── README.md                 # 项目说明
├── docs/                     # 文档目录
│   ├── REQUIREMENTS.md       # 需求文档
│   ├── ARCHITECTURE.md       # 架构设计
│   └── AGENT_DESIGN.md       # 智能体设计
├── agents/                   # 智能体模块
│   ├── base.py               # 基类
│   ├── retail.py             # 散户智能体
│   ├── institution.py        # 机构智能体
│   ├── quant.py              # 量化智能体
│   ├── whale.py              # 巨鲸智能体
│   └── kol.py                # KOL 智能体
├── market/                   # 市场模块
│   ├── engine.py             # 撮合引擎
│   ├── orderbook.py          # 订单簿
│   └── price.py              # 价格计算
├── data/                     # 数据模块
│   ├── fetcher.py            # 数据获取
│   └── feeds.py              # 数据源
├── config/                   # 配置
├── utils/                    # 工具函数
├── tests/                    # 测试
├── requirements.txt          # 依赖
└── main.py                   # 入口
```

---

## 📊 开发进度

| 模块 | 状态 | 说明 |
|------|------|------|
| 需求文档 | 🔄 进行中 | 待确认 |
| 架构设计 | 📝 待开始 | - |
| 智能体框架 | 📝 待开始 | - |
| 市场引擎 | 📝 待开始 | - |
| 数据接入 | 📝 待开始 | - |
| 前端界面 | 📝 待开始 | - |

---

## 📝 License

MIT
