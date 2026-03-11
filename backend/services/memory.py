"""
GraphRAG 记忆系统 - 时序图谱存储
使用 NetworkX 本地图谱 + 可选 Neo4j 持久化
"""

from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
import json
import hashlib
import networkx as nx
from dataclasses import dataclass, field


@dataclass
class MemoryNode:
    """记忆节点"""
    id: str
    content: str
    timestamp: datetime
    node_type: str  # event, thought, action, market_state
    importance: float = 0.5
    metadata: Dict[str, Any] = field(default_factory=dict)
    embedding: Optional[List[float]] = None


@dataclass
class MemoryEdge:
    """记忆边"""
    source_id: str
    target_id: str
    edge_type: str  # causes, influences, follows, relates_to
    weight: float = 1.0
    metadata: Dict[str, Any] = field(default_factory=dict)


class GraphMemory:
    """图谱记忆系统"""
    
    def __init__(self, agent_id: str):
        self.agent_id = agent_id
        self.graph = nx.DiGraph()
        self.temporal_index: Dict[str, List[str]] = {}  # timestamp -> node_ids
        self.type_index: Dict[str, List[str]] = {}  # node_type -> node_ids
    
    def _generate_id(self, content: str, timestamp: datetime) -> str:
        """生成唯一 ID"""
        hash_input = f"{self.agent_id}:{content}:{timestamp.isoformat()}"
        return hashlib.sha256(hash_input.encode()).hexdigest()[:12]
    
    def add_memory(
        self,
        content: str,
        node_type: str,
        timestamp: datetime = None,
        importance: float = 0.5,
        metadata: Dict = None,
        related_to: List[str] = None
    ) -> str:
        """添加记忆节点"""
        timestamp = timestamp or datetime.utcnow()
        node_id = self._generate_id(content, timestamp)
        
        node = MemoryNode(
            id=node_id,
            content=content,
            timestamp=timestamp,
            node_type=node_type,
            importance=importance,
            metadata=metadata or {}
        )
        
        # 添加到图
        self.graph.add_node(
            node_id,
            content=content,
            timestamp=timestamp.isoformat(),
            node_type=node_type,
            importance=importance,
            metadata=metadata or {}
        )
        
        # 更新索引
        time_key = timestamp.strftime("%Y-%m-%d-%H")
        if time_key not in self.temporal_index:
            self.temporal_index[time_key] = []
        self.temporal_index[time_key].append(node_id)
        
        if node_type not in self.type_index:
            self.type_index[node_type] = []
        self.type_index[node_type].append(node_id)
        
        # 建立关联
        if related_to:
            for related_id in related_to:
                if self.graph.has_node(related_id):
                    self.add_edge(related_id, node_id, "relates_to")
        
        return node_id
    
    def add_edge(
        self,
        source_id: str,
        target_id: str,
        edge_type: str,
        weight: float = 1.0,
        metadata: Dict = None
    ) -> bool:
        """添加记忆边"""
        if not self.graph.has_node(source_id) or not self.graph.has_node(target_id):
            return False
        
        self.graph.add_edge(
            source_id,
            target_id,
            edge_type=edge_type,
            weight=weight,
            metadata=metadata or {}
        )
        return True
    
    def get_recent_memories(
        self,
        limit: int = 10,
        node_type: str = None,
        min_importance: float = 0.0
    ) -> List[Dict]:
        """获取最近的记忆"""
        nodes = []
        for node_id in self.graph.nodes():
            data = self.graph.nodes[node_id]
            if node_type and data.get("node_type") != node_type:
                continue
            if data.get("importance", 0) < min_importance:
                continue
            nodes.append({
                "id": node_id,
                **data
            })
        
        # 按时间排序
        nodes.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        return nodes[:limit]
    
    def get_related_memories(
        self,
        node_id: str,
        depth: int = 2,
        edge_types: List[str] = None
    ) -> List[Dict]:
        """获取相关记忆（BFS）"""
        if not self.graph.has_node(node_id):
            return []
        
        visited = set()
        result = []
        queue = [(node_id, 0)]
        
        while queue:
            current_id, current_depth = queue.pop(0)
            if current_id in visited or current_depth > depth:
                continue
            
            visited.add(current_id)
            
            if current_id != node_id:
                data = self.graph.nodes[current_id]
                result.append({"id": current_id, **data})
            
            # 获取相邻节点
            for neighbor in self.graph.neighbors(current_id):
                edge_data = self.graph.edges[current_id, neighbor]
                if edge_types and edge_data.get("edge_type") not in edge_types:
                    continue
                queue.append((neighbor, current_depth + 1))
        
        return result
    
    def get_temporal_context(
        self,
        target_time: datetime,
        hours_before: int = 24,
        hours_after: int = 0
    ) -> List[Dict]:
        """获取时间窗口内的记忆"""
        result = []
        
        for node_id in self.graph.nodes():
            data = self.graph.nodes[node_id]
            node_time = datetime.fromisoformat(data.get("timestamp", "2000-01-01"))
            
            time_diff = (target_time - node_time).total_seconds() / 3600
            
            if -hours_after <= time_diff <= hours_before:
                result.append({
                    "id": node_id,
                    "time_diff_hours": time_diff,
                    **data
                })
        
        result.sort(key=lambda x: x.get("timestamp", ""))
        return result
    
    def find_causal_chain(
        self,
        start_id: str,
        end_id: str
    ) -> Optional[List[str]]:
        """查找因果链"""
        if not self.graph.has_node(start_id) or not self.graph.has_node(end_id):
            return None
        
        try:
            path = nx.shortest_path(self.graph, start_id, end_id)
            return path
        except nx.NetworkXNoPath:
            return None
    
    def get_influence_score(self, node_id: str) -> float:
        """计算节点影响力分数"""
        if not self.graph.has_node(node_id):
            return 0.0
        
        # PageRank 计算
        try:
            pagerank = nx.pagerank(self.graph, alpha=0.85)
            return pagerank.get(node_id, 0.0)
        except:
            return 0.0
    
    def to_dict(self) -> Dict:
        """导出为字典"""
        return {
            "agent_id": self.agent_id,
            "nodes": [
                {"id": n, **self.graph.nodes[n]}
                for n in self.graph.nodes()
            ],
            "edges": [
                {
                    "source": u,
                    "target": v,
                    **self.graph.edges[u, v]
                }
                for u, v in self.graph.edges()
            ],
            "stats": {
                "total_nodes": self.graph.number_of_nodes(),
                "total_edges": self.graph.number_of_edges(),
                "density": nx.density(self.graph) if self.graph.number_of_nodes() > 0 else 0
            }
        }
    
    def from_dict(self, data: Dict):
        """从字典导入"""
        self.graph.clear()
        
        for node in data.get("nodes", []):
            node_id = node.pop("id")
            self.graph.add_node(node_id, **node)
        
        for edge in data.get("edges", []):
            source = edge.pop("source")
            target = edge.pop("target")
            self.graph.add_edge(source, target, **edge)


class CollectiveMemory:
    """集体记忆 - 管理多个智能体的记忆交互"""
    
    def __init__(self):
        self.agent_memories: Dict[str, GraphMemory] = {}
        self.shared_events: List[Dict] = []  # 公共事件
    
    def get_or_create_memory(self, agent_id: str) -> GraphMemory:
        """获取或创建智能体记忆"""
        if agent_id not in self.agent_memories:
            self.agent_memories[agent_id] = GraphMemory(agent_id)
        return self.agent_memories[agent_id]
    
    def broadcast_event(
        self,
        event_content: str,
        event_type: str,
        importance: float = 0.5,
        source_agent: str = None
    ) -> List[str]:
        """广播事件到所有智能体"""
        event_id = hashlib.sha256(f"{event_content}:{datetime.utcnow().isoformat()}".encode()).hexdigest()[:12]
        
        self.shared_events.append({
            "id": event_id,
            "content": event_content,
            "type": event_type,
            "importance": importance,
            "source": source_agent,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # 添加到每个智能体的记忆
        node_ids = []
        for agent_id, memory in self.agent_memories.items():
            node_id = memory.add_memory(
                content=event_content,
                node_type=event_type,
                importance=importance,
                metadata={"source": source_agent, "is_broadcast": True}
            )
            node_ids.append((agent_id, node_id))
        
        return node_ids
    
    def propagate_influence(
        self,
        source_agent: str,
        target_agents: List[str],
        influence_content: str,
        influence_strength: float = 0.5
    ):
        """传播影响（如 KOL 影响散户）"""
        source_memory = self.get_or_create_memory(source_agent)
        source_node = source_memory.add_memory(
            content=f"[发出影响] {influence_content}",
            node_type="influence_out",
            importance=influence_strength
        )
        
        for target_id in target_agents:
            target_memory = self.get_or_create_memory(target_id)
            target_node = target_memory.add_memory(
                content=f"[受到影响] 来自 {source_agent}: {influence_content}",
                node_type="influence_in",
                importance=influence_strength * 0.8,
                metadata={"source_agent": source_agent}
            )
    
    def get_market_narrative(self, limit: int = 20) -> List[Dict]:
        """获取市场叙事（综合所有事件）"""
        all_events = []
        
        # 收集所有智能体的重要记忆
        for agent_id, memory in self.agent_memories.items():
            important_memories = memory.get_recent_memories(
                limit=limit // len(self.agent_memories) if self.agent_memories else limit,
                min_importance=0.6
            )
            for mem in important_memories:
                mem["agent_id"] = agent_id
                all_events.append(mem)
        
        # 添加公共事件
        all_events.extend(self.shared_events[-limit:])
        
        # 按时间排序
        all_events.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        return all_events[:limit]
