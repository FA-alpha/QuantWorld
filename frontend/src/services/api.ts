const API_BASE = '/api'

export interface SimulationConfig {
  name: string
  duration_hours: number
  interval_hours: number
  agents: {
    retail: number
    institutional: number
    whale: number
    analyst?: number
    kol?: number
  }
  symbols: string[]
}

export interface Simulation {
  simulation_id: string
  name: string
  status: string
  created_at: string
  config: SimulationConfig
}

export const api = {
  // 健康检查
  async health(): Promise<{ status: string }> {
    const resp = await fetch(`${API_BASE}/health`)
    return resp.json()
  },
  
  // 创建仿真
  async createSimulation(config: SimulationConfig): Promise<Simulation> {
    const resp = await fetch(`${API_BASE}/simulations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    })
    return resp.json()
  },
  
  // 获取仿真列表
  async listSimulations(): Promise<{ simulation_id: string; state: any }[]> {
    const resp = await fetch(`${API_BASE}/simulations`)
    return resp.json()
  },
  
  // 获取仿真详情
  async getSimulation(id: string): Promise<{ simulation_id: string; state: any; recent_events: any[] }> {
    const resp = await fetch(`${API_BASE}/simulations/${id}`)
    return resp.json()
  },
  
  // 启动仿真
  async startSimulation(id: string): Promise<{ status: string }> {
    const resp = await fetch(`${API_BASE}/simulations/${id}/start`, { method: 'POST' })
    return resp.json()
  },
  
  // 停止仿真
  async stopSimulation(id: string): Promise<{ status: string }> {
    const resp = await fetch(`${API_BASE}/simulations/${id}/stop`, { method: 'POST' })
    return resp.json()
  },
  
  // 获取智能体
  async getAgents(id: string): Promise<{ agents: any[]; total: number }> {
    const resp = await fetch(`${API_BASE}/simulations/${id}/agents`)
    return resp.json()
  },
  
  // 获取关系图谱
  async getGraph(id: string): Promise<{ nodes: any[]; edges: any[] }> {
    const resp = await fetch(`${API_BASE}/simulations/${id}/graph`)
    return resp.json()
  },
  
  // 获取市场快照
  async getMarketSnapshot(): Promise<any> {
    const resp = await fetch(`${API_BASE}/market/snapshot`)
    return resp.json()
  }
}
