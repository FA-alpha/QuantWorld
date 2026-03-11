import { useEffect, useRef, useState } from 'react'
import { Network, Options } from 'vis-network'

interface GraphNode {
  id: string
  label: string
  group: string
  color: string
  size: number
}

interface GraphEdge {
  from: string
  to: string
  value?: number
}

interface AgentGraphProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  height?: number
}

export default function AgentGraph({ nodes, edges, height = 400 }: AgentGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const networkRef = useRef<Network | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  
  useEffect(() => {
    if (!containerRef.current) return
    
    const data = {
      nodes: nodes.map(n => ({
        id: n.id,
        label: n.label,
        color: n.color,
        size: n.size,
        font: { color: '#E6EDF3' }
      })),
      edges: edges.map(e => ({
        from: e.from,
        to: e.to,
        value: e.value || 1,
        color: { color: '#30363D', highlight: '#58A6FF' }
      }))
    }
    
    const options: Options = {
      nodes: {
        shape: 'dot',
        borderWidth: 2,
        shadow: true
      },
      edges: {
        width: 1,
        smooth: false
      },
      physics: {
        stabilization: false,
        barnesHut: {
          gravitationalConstant: -3000,
          springLength: 150
        }
      },
      interaction: {
        hover: true,
        tooltipDelay: 100
      }
    }
    
    networkRef.current = new Network(containerRef.current, data, options)
    
    networkRef.current.on('selectNode', (params) => {
      if (params.nodes.length > 0) {
        setSelectedNode(params.nodes[0])
      }
    })
    
    networkRef.current.on('deselectNode', () => {
      setSelectedNode(null)
    })
    
    return () => {
      networkRef.current?.destroy()
    }
  }, [nodes, edges])
  
  return (
    <div className="relative">
      <div 
        ref={containerRef} 
        style={{ height: `${height}px` }}
        className="bg-dark-bg rounded-lg border border-border"
      />
      
      {/* 图例 */}
      <div className="absolute top-4 left-4 bg-card-bg/90 rounded-lg p-3 text-sm">
        <div className="font-semibold mb-2">智能体类型</div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-3 h-3 rounded-full bg-[#F85149]" />
          <span>散户</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-3 h-3 rounded-full bg-[#3FB950]" />
          <span>机构</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#58A6FF]" />
          <span>巨鲸</span>
        </div>
      </div>
      
      {selectedNode && (
        <div className="absolute bottom-4 right-4 bg-card-bg/90 rounded-lg p-3 text-sm">
          <div className="font-semibold">Agent: {selectedNode}</div>
        </div>
      )}
    </div>
  )
}
