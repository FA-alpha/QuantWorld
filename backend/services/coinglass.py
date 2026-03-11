"""
Coinglass API 数据服务
"""

import httpx
import os
from typing import Any, Dict, List, Optional
from datetime import datetime
import json


class CoinglassService:
    """Coinglass 数据服务"""
    
    BASE_URL = "https://open-api-v4.coinglass.com"
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("COINGLASS_API_KEY")
        if not self.api_key:
            raise ValueError("COINGLASS_API_KEY not set")
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def _get(self, endpoint: str, params: Dict = None) -> Optional[Any]:
        """发送 GET 请求"""
        headers = {
            "CG-API-KEY": self.api_key,
            "Accept": "application/json"
        }
        try:
            resp = await self.client.get(
                f"{self.BASE_URL}{endpoint}",
                headers=headers,
                params=params
            )
            data = resp.json()
            if data.get("code") == "0":
                return data.get("data")
            return None
        except Exception as e:
            print(f"Coinglass API error: {e}")
            return None
    
    async def get_fear_greed_index(self) -> Optional[Dict]:
        """获取恐惧贪婪指数"""
        data = await self._get("/api/index/fear-greed-history")
        if data:
            latest = data[-1] if isinstance(data, list) else data
            return {
                "value": latest.get("value", 50),
                "classification": latest.get("value_classification", "Neutral"),
                "timestamp": datetime.utcnow().isoformat()
            }
        return None
    
    async def get_funding_rates(self, symbol: str = "BTC") -> Optional[List[Dict]]:
        """获取资金费率"""
        data = await self._get("/api/futures/funding-rate/exchange-list", {"symbol": symbol})
        if not data:
            return None
        
        rates = []
        for item in data:
            for ex in item.get("stablecoin_margin_list", []):
                rates.append({
                    "exchange": ex.get("exchange"),
                    "rate": ex.get("funding_rate", 0),
                    "next_funding_time": ex.get("next_funding_time")
                })
        return rates
    
    async def get_open_interest(self, symbol: str = "BTC", interval: str = "1h", limit: int = 24) -> Optional[List[Dict]]:
        """获取未平仓合约"""
        data = await self._get(
            "/api/futures/open-interest/aggregated-history",
            {"symbol": symbol, "interval": interval, "limit": limit}
        )
        if not data:
            return None
        
        return [
            {
                "timestamp": item.get("timestamp"),
                "open_interest": float(item.get("close", 0)),
                "symbol": symbol
            }
            for item in data
        ]
    
    async def get_liquidations(self) -> Optional[Dict]:
        """获取清算数据"""
        data = await self._get("/api/futures/liquidation/coin-list")
        if not data:
            return None
        
        total_long = sum(float(c.get("long_liquidation_usd", 0)) for c in data)
        total_short = sum(float(c.get("short_liquidation_usd", 0)) for c in data)
        
        return {
            "total_long_usd": total_long,
            "total_short_usd": total_short,
            "total_usd": total_long + total_short,
            "coins": [
                {
                    "symbol": c.get("symbol"),
                    "long_usd": float(c.get("long_liquidation_usd", 0)),
                    "short_usd": float(c.get("short_liquidation_usd", 0))
                }
                for c in data[:10]  # Top 10
            ]
        }
    
    async def get_etf_flows(self, asset: str = "bitcoin") -> Optional[Dict]:
        """获取 ETF 资金流向"""
        data = await self._get(f"/api/etf/{asset}/flow-history")
        if not data:
            return None
        
        recent = data[-7:] if len(data) >= 7 else data
        return {
            "asset": asset,
            "latest_flow": float(recent[-1].get("value", 0)) if recent else 0,
            "7d_flow": sum(float(d.get("value", 0)) for d in recent),
            "history": [
                {"date": d.get("date"), "flow": float(d.get("value", 0))}
                for d in recent
            ]
        }
    
    async def get_market_snapshot(self, symbols: List[str] = None) -> Dict[str, Any]:
        """获取市场快照（组合多个数据）"""
        symbols = symbols or ["BTC", "ETH", "SOL", "DOGE", "XRP", "ADA", "BCH"]
        
        fear_greed = await self.get_fear_greed_index()
        btc_funding = await self.get_funding_rates("BTC")
        eth_funding = await self.get_funding_rates("ETH")
        liquidations = await self.get_liquidations()
        btc_etf = await self.get_etf_flows("bitcoin")
        eth_etf = await self.get_etf_flows("ethereum")
        btc_oi = await self.get_open_interest("BTC")
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "fear_greed": fear_greed,
            "funding_rates": {
                "BTC": btc_funding,
                "ETH": eth_funding
            },
            "liquidations": liquidations,
            "etf_flows": {
                "BTC": btc_etf,
                "ETH": eth_etf
            },
            "open_interest": {
                "BTC": btc_oi[-1] if btc_oi else None
            }
        }
    
    async def close(self):
        """关闭客户端"""
        await self.client.aclose()
