#!/bin/bash

# 启动 QuantWorld

echo "🚀 启动 QuantWorld..."

# 检查虚拟环境
if [ ! -d "backend/venv" ]; then
    echo "📦 创建虚拟环境..."
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
fi

# 启动后端
echo "🔧 启动后端 API..."
cd backend
source venv/bin/activate
export PYTHONPATH="${PYTHONPATH}:$(pwd)/.."
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ..

# 启动前端
echo "🎨 启动前端..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
fi
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ QuantWorld 已启动"
echo "   后端: http://localhost:8000"
echo "   前端: http://localhost:3000"
echo "   API 文档: http://localhost:8000/docs"
echo ""
echo "按 Ctrl+C 停止"

# 等待
wait $BACKEND_PID $FRONTEND_PID
