# QuantWorld Docker 镜像
FROM python:3.12-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    nodejs npm \
    && rm -rf /var/lib/apt/lists/*

# 复制后端
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend ./backend

# 复制前端
COPY frontend ./frontend
WORKDIR /app/frontend
RUN npm install && npm run build

WORKDIR /app

# 暴露端口
EXPOSE 8000

# 启动命令
ENV PYTHONPATH=/app
CMD ["uvicorn", "backend.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
