"""
FastAPI 主入口
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import asyncio
import json
import os

app = FastAPI(
    title="QuantWorld API",
    description="多智能体市场仿真系统 API",
    version="0.1.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 导入路由
from backend.api.routes import router
app.include_router(router)

# WebSocket 连接管理
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, sim_id: str):
        await websocket.accept()
        if sim_id not in self.active_connections:
            self.active_connections[sim_id] = []
        self.active_connections[sim_id].append(websocket)
    
    def disconnect(self, websocket: WebSocket, sim_id: str):
        if sim_id in self.active_connections:
            self.active_connections[sim_id].remove(websocket)
    
    async def broadcast(self, message: dict, sim_id: str):
        if sim_id in self.active_connections:
            for connection in self.active_connections[sim_id]:
                try:
                    await connection.send_json(message)
                except:
                    pass

manager = ConnectionManager()


@app.get("/")
async def root():
    return {
        "service": "QuantWorld API",
        "version": "0.1.0",
        "docs": "/docs"
    }


@app.websocket("/ws/simulation/{sim_id}")
async def websocket_simulation(websocket: WebSocket, sim_id: str):
    """WebSocket 实时仿真更新"""
    await manager.connect(websocket, sim_id)
    
    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            
            if msg.get("action") == "ping":
                await websocket.send_json({"action": "pong", "sim_id": sim_id})
            elif msg.get("action") == "subscribe":
                await websocket.send_json({"action": "subscribed", "sim_id": sim_id})
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, sim_id)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
