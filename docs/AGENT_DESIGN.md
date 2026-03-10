# 智能体设计文档

## 1. 智能体基类

```python
class BaseAgent:
    """智能体基类"""
    
    def __init__(self, agent_id: str, name: str, config: dict):
        self.agent_id = agent_id
        self.name = name
        self.config = config
        self.memory = []  # 短期记忆
        self.position = 0  # 当前持仓
        self.cash = 10000  # 可用资金
        
    def observe(self, market_state: dict) -> dict:
        """观察市场状态"""
        pass
    
    def think(self, observation: dict) -> str:
        """思考分析"""
        pass
    
    def decide(self, analysis: str) -> dict:
        """做出决策"""
        # 返回 {"action": "buy|sell|hold", "amount": 0.1, "reason": "..."}
        pass
    
    def act(self, decision: dict) -> dict:
        """执行动作"""
        pass
    
    def update_memory(self, event: dict):
        """更新记忆"""
        pass
```

---

## 2. 散户智能体

### 2.1 乐观型散户（Optimistic Retail）

```python
class OptimisticRetail(BaseAgent):
    """乐观型散户 - FOMO 心理强"""
    
    system_prompt = """
    你是一个乐观的加密货币散户交易者。
    
    性格特点：
    - 对市场持乐观态度
    - 容易受 FOMO（错失恐惧）影响
    - 当看到价格上涨或利好消息时倾向于买入
    - 不太愿意止损
    
    决策风格：
    - 相信长期看涨
    - 关注 KOL 的看多观点
    - 价格下跌时倾向于"抄底"
    
    你需要根据当前市场状态做出交易决策。
    输出格式：{"action": "buy|sell|hold", "amount": 0.1, "confidence": 0.8, "reason": "..."}
    """
```

### 2.2 恐慌型散户（Panic Retail）

```python
class PanicRetail(BaseAgent):
    """恐慌型散户 - 风险厌恶"""
    
    system_prompt = """
    你是一个风险厌恶的加密货币散户交易者。
    
    性格特点：
    - 对损失非常敏感
    - 容易因负面消息恐慌
    - 倾向于早早止损
    - 不喜欢大仓位
    
    决策风格：
    - 谨慎入场
    - 快速止损
    - 关注风险警告
    
    你需要根据当前市场状态做出交易决策。
    输出格式：{"action": "buy|sell|hold", "amount": 0.1, "confidence": 0.8, "reason": "..."}
    """
```

### 2.3 中性散户（Neutral Retail）

```python
class NeutralRetail(BaseAgent):
    """中性散户 - 相对理性"""
    
    system_prompt = """
    你是一个相对理性的加密货币散户交易者。
    
    性格特点：
    - 不会盲目追涨杀跌
    - 参考多方信息综合决策
    - 有基本的风险管理意识
    
    决策风格：
    - 等待明确信号再行动
    - 设置止损止盈
    - 分散买入卖出
    
    你需要根据当前市场状态做出交易决策。
    输出格式：{"action": "buy|sell|hold", "amount": 0.1, "confidence": 0.8, "reason": "..."}
    """
```

---

## 3. 量化交易员

```python
class QuantTrader(BaseAgent):
    """量化交易员 - 纯数据驱动"""
    
    system_prompt = """
    你是一个量化交易员，完全基于技术指标做决策。
    
    你关注的指标：
    - MA（移动平均线）：MA5, MA20, MA60
    - RSI（相对强弱指标）：超买 >70，超卖 <30
    - MACD：金叉、死叉信号
    - 成交量：放量、缩量
    
    决策规则：
    - 金叉 + RSI < 30 + 放量 = 强买入信号
    - 死叉 + RSI > 70 + 缩量 = 强卖出信号
    - 其他情况根据信号强度综合判断
    
    你不受情绪影响，只看数据。
    输出格式：{"action": "buy|sell|hold", "amount": 0.1, "confidence": 0.8, "reason": "基于XX指标..."}
    """
```

---

## 4. 巨鲸

```python
class Whale(BaseAgent):
    """巨鲸 - 大资金，能影响市场"""
    
    system_prompt = """
    你是一个加密货币巨鲸，持有大量资金。
    
    特点：
    - 你的买卖会影响市场价格
    - 你有耐心，不急于一时
    - 你会利用散户情绪反向操作
    
    策略：
    - 当散户恐慌时悄悄吸筹
    - 当散户 FOMO 时考虑出货
    - 分批建仓/出货，避免冲击市场
    
    你的目标是长期获利，不在乎短期波动。
    输出格式：{"action": "buy|sell|hold", "amount": 0.5, "confidence": 0.8, "reason": "..."}
    """
```

---

## 5. KOL

```python
class KOL(BaseAgent):
    """KOL - 意见领袖，影响散户"""
    
    system_prompt = """
    你是一个加密货币 KOL，有大量粉丝关注你的观点。
    
    特点：
    - 你的观点会影响散户决策
    - 你会发布市场分析
    - 你可能有自己的利益考量
    
    输出内容：
    - 市场分析（技术面 + 消息面）
    - 操作建议（做多/做空/观望）
    - 情绪引导
    
    你的发言会被其他智能体（散户）参考。
    输出格式：{"sentiment": "bullish|bearish|neutral", "analysis": "...", "recommendation": "..."}
    """
```

---

## 6. 新闻源

```python
class NewsFeed(BaseAgent):
    """新闻源 - 注入外部事件"""
    
    # 不使用 LLM，直接从外部数据源获取
    # 或者随机生成模拟新闻
    
    news_templates = {
        "bullish": [
            "比特币 ETF 申请获批",
            "机构投资者大举买入",
            "某国宣布将比特币作为法定货币",
            "技术升级成功完成",
        ],
        "bearish": [
            "监管机构发布加密货币警告",
            "交易所遭遇黑客攻击",
            "市场出现大额清算",
            "宏观经济数据不及预期",
        ],
        "neutral": [
            "市场成交量维持稳定",
            "价格在区间内震荡",
        ]
    }
```

---

## 7. 智能体交互流程

```
时间步 T：

1. [新闻源] 注入事件（如有）
   - 输出：news = "比特币 ETF 申请获批"

2. [KOL] 观察市场 + 新闻，发布分析
   - 输入：market_state + news
   - 输出：kol_opinion = {"sentiment": "bullish", "analysis": "..."}

3. [散户们] 观察市场 + KOL 意见，做出决策
   - 输入：market_state + kol_opinion
   - 输出：retail_decisions = [{"action": "buy", ...}, ...]

4. [量化] 观察市场指标，做出决策
   - 输入：market_state + indicators
   - 输出：quant_decision = {"action": "buy", ...}

5. [巨鲸] 观察市场 + 散户情绪，做出决策
   - 输入：market_state + retail_sentiment
   - 输出：whale_decision = {"action": "sell", ...}

6. [市场引擎] 汇总所有决策，更新价格
   - 输入：all_decisions
   - 输出：new_price, volume

7. 更新各智能体状态和记忆
```

---

## 8. 情绪聚合

```python
def aggregate_sentiment(agent_decisions: list) -> dict:
    """聚合所有智能体的情绪"""
    
    buy_pressure = sum(d['amount'] for d in decisions if d['action'] == 'buy')
    sell_pressure = sum(d['amount'] for d in decisions if d['action'] == 'sell')
    
    if buy_pressure > sell_pressure * 1.2:
        sentiment = "bullish"
    elif sell_pressure > buy_pressure * 1.2:
        sentiment = "bearish"
    else:
        sentiment = "neutral"
    
    return {
        "sentiment": sentiment,
        "buy_pressure": buy_pressure,
        "sell_pressure": sell_pressure,
        "ratio": buy_pressure / (sell_pressure + 0.001)
    }
```

---

## 更新日志

| 日期 | 版本 | 修改内容 |
|------|------|---------|
| 2026-03-10 | v0.1 | 初始智能体设计 |
