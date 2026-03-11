"""
FastAPI 主入口
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import List
import asyncio
import json

app = FastAPI(title="QuantWorld API", version="0.1.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 活跃的 WebSocket 连接
active_connections: List[WebSocket] = []


@app.get("/")
async def root():
    return {"status": "ok", "service": "QuantWorld API"}


@app.get("/api/health")
async def health():
    return {"status": "healthy"}


@app.websocket("/ws/simulation/{sim_id}")
async def websocket_simulation(websocket: WebSocket, sim_id: str):
    """WebSocket 实时仿真更新"""
    await websocket.accept()
    active_connections.append(websocket)
    
    try:
        while True:
            data = await websocket.receive_text()
            # 处理客户端消息
            msg = json.loads(data)
            
            if msg.get("action") == "ping":
                await websocket.send_json({"action": "pong"})
            
    except WebSocketDisconnect:
        active_connections.remove(websocket)


async def broadcast(message: dict):
    """广播消息给所有连接"""
    for connection in active_connections:
        try:
            await connection.send_json(message)
        except:
            pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
