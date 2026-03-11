"""
LLM 服务 - 智能体推理引擎
"""

import httpx
import os
from typing import Any, Dict, List, Optional
import json


class LLMService:
    """LLM 推理服务（支持 OpenRouter）"""
    
    def __init__(
        self,
        api_key: str = None,
        model: str = "anthropic/claude-3-haiku",
        base_url: str = "https://openrouter.ai/api/v1"
    ):
        self.api_key = api_key or os.getenv("OPENROUTER_API_KEY")
        self.model = model
        self.base_url = base_url
        self.client = httpx.AsyncClient(timeout=60.0)
    
    async def complete(
        self,
        prompt: str,
        system: str = None,
        temperature: float = 0.7,
        max_tokens: int = 500
    ) -> str:
        """生成文本"""
        if not self.api_key:
            return "[LLM未配置] 使用默认逻辑"
        
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        
        try:
            resp = await self.client.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens
                }
            )
            data = resp.json()
            return data.get("choices", [{}])[0].get("message", {}).get("content", "")
        except Exception as e:
            return f"[LLM错误] {str(e)}"
    
    async def analyze_market(self, market_data: Dict) -> Dict[str, Any]:
        """分析市场数据"""
        prompt = f"""分析以下加密货币市场数据，给出简短判断：

恐惧贪婪指数: {market_data.get('fear_greed', {}).get('value', 50)}
24H清算: 多头 ${market_data.get('liquidations', {}).get('total_long_usd', 0)/1e6:.1f}M, 空头 ${market_data.get('liquidations', {}).get('total_short_usd', 0)/1e6:.1f}M
BTC ETF流入: ${market_data.get('etf_flows', {}).get('BTC', {}).get('latest_flow', 0)/1e6:.1f}M

请用JSON格式回答：
{{"sentiment": "bullish/bearish/neutral", "confidence": 0.0-1.0, "reason": "简短理由"}}"""
        
        system = "你是一个加密货币市场分析师。用JSON格式简短回答。"
        
        result = await self.complete(prompt, system=system, temperature=0.3)
        
        try:
            return json.loads(result)
        except:
            return {"sentiment": "neutral", "confidence": 0.5, "reason": result[:100]}
    
    async def generate_agent_thought(
        self,
        agent_type: str,
        personality: Dict,
        market_data: Dict,
        recent_memories: List[str]
    ) -> str:
        """生成智能体思考"""
        prompt = f"""你是一个 {agent_type} 类型的交易者。

性格特点:
- 理性程度: {personality.get('rationality', 0.5):.1%}
- 风险承受: {personality.get('risk_tolerance', 0.5):.1%}
- 趋势跟随: {personality.get('trend_following', 0.5):.1%}

当前市场:
- 恐惧贪婪: {market_data.get('fear_greed', {}).get('value', 50)}

最近记忆:
{chr(10).join(f'- {m}' for m in recent_memories[:3]) if recent_memories else '- 无'}

用一句话描述你现在的想法和打算："""
        
        system = f"你正在扮演一个 {agent_type}。用第一人称简短回答（不超过50字）。"
        
        return await self.complete(prompt, system=system, max_tokens=100)
    
    async def close(self):
        await self.client.aclose()


# 创建全局实例
_llm_service: Optional[LLMService] = None

def get_llm_service() -> LLMService:
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service
