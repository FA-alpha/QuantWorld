import ReactECharts from 'echarts-for-react'
import { useMemo } from 'react'

interface TimeSeriesData {
  time: string
  value: number
}

// 恐惧贪婪指数仪表盘
export function FearGreedGauge({ value }: { value: number }) {
  const option = useMemo(() => ({
    series: [{
      type: 'gauge',
      startAngle: 180,
      endAngle: 0,
      min: 0,
      max: 100,
      splitNumber: 4,
      itemStyle: {
        color: value < 25 ? '#F85149' : value < 45 ? '#D29922' : value < 55 ? '#8B949E' : value < 75 ? '#3FB950' : '#58A6FF'
      },
      progress: {
        show: true,
        width: 18
      },
      pointer: {
        show: false
      },
      axisLine: {
        lineStyle: {
          width: 18,
          color: [[0.25, '#F85149'], [0.45, '#D29922'], [0.55, '#8B949E'], [0.75, '#3FB950'], [1, '#58A6FF']]
        }
      },
      axisTick: {
        show: false
      },
      splitLine: {
        show: false
      },
      axisLabel: {
        show: false
      },
      title: {
        offsetCenter: [0, '30%'],
        fontSize: 14,
        color: '#8B949E'
      },
      detail: {
        fontSize: 28,
        offsetCenter: [0, '-10%'],
        valueAnimation: true,
        color: '#E6EDF3',
        formatter: '{value}'
      },
      data: [{
        value,
        name: value < 25 ? '极度恐惧' : value < 45 ? '恐惧' : value < 55 ? '中性' : value < 75 ? '贪婪' : '极度贪婪'
      }]
    }]
  }), [value])
  
  return <ReactECharts option={option} style={{ height: 200 }} />
}

// 资金流向柱状图
export function FundFlowChart({ data }: { data: { date: string; flow: number }[] }) {
  const option = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#161B22',
      borderColor: '#30363D',
      textStyle: { color: '#E6EDF3' },
      formatter: (params: any) => {
        const d = params[0]
        return `${d.name}<br/>流入: $${(d.value / 1e6).toFixed(1)}M`
      }
    },
    grid: {
      left: 50,
      right: 20,
      top: 20,
      bottom: 30
    },
    xAxis: {
      type: 'category',
      data: data.map(d => d.date.slice(5)),
      axisLine: { lineStyle: { color: '#30363D' } },
      axisLabel: { color: '#8B949E', fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#30363D', type: 'dashed' } },
      axisLabel: {
        color: '#8B949E',
        fontSize: 10,
        formatter: (v: number) => `$${(v / 1e6).toFixed(0)}M`
      }
    },
    series: [{
      type: 'bar',
      data: data.map(d => ({
        value: d.flow,
        itemStyle: { color: d.flow > 0 ? '#3FB950' : '#F85149' }
      })),
      barWidth: '60%'
    }]
  }), [data])
  
  return <ReactECharts option={option} style={{ height: 200 }} />
}

// 智能体情绪分布饼图
export function AgentSentimentPie({ data }: { data: { type: string; bullish: number; bearish: number; neutral: number }[] }) {
  const option = useMemo(() => ({
    tooltip: {
      trigger: 'item',
      backgroundColor: '#161B22',
      borderColor: '#30363D',
      textStyle: { color: '#E6EDF3' }
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      textStyle: { color: '#8B949E', fontSize: 12 }
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['40%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 4,
        borderColor: '#0D1117',
        borderWidth: 2
      },
      label: { show: false },
      data: [
        { value: data.reduce((s, d) => s + d.bullish, 0), name: '看多', itemStyle: { color: '#3FB950' } },
        { value: data.reduce((s, d) => s + d.bearish, 0), name: '看空', itemStyle: { color: '#F85149' } },
        { value: data.reduce((s, d) => s + d.neutral, 0), name: '中性', itemStyle: { color: '#8B949E' } }
      ]
    }]
  }), [data])
  
  return <ReactECharts option={option} style={{ height: 200 }} />
}

// 持仓变化折线图
export function PositionChart({ data }: { data: TimeSeriesData[] }) {
  const option = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#161B22',
      borderColor: '#30363D',
      textStyle: { color: '#E6EDF3' }
    },
    grid: {
      left: 50,
      right: 20,
      top: 20,
      bottom: 30
    },
    xAxis: {
      type: 'category',
      data: data.map(d => d.time),
      axisLine: { lineStyle: { color: '#30363D' } },
      axisLabel: { color: '#8B949E', fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#30363D', type: 'dashed' } },
      axisLabel: { color: '#8B949E', fontSize: 10 }
    },
    series: [{
      type: 'line',
      data: data.map(d => d.value),
      smooth: true,
      lineStyle: { color: '#58A6FF', width: 2 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(88, 166, 255, 0.3)' },
            { offset: 1, color: 'rgba(88, 166, 255, 0)' }
          ]
        }
      }
    }]
  }), [data])
  
  return <ReactECharts option={option} style={{ height: 200 }} />
}

// 清算数据柱状图
export function LiquidationChart({ long, short }: { long: number; short: number }) {
  const option = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#161B22',
      borderColor: '#30363D',
      textStyle: { color: '#E6EDF3' },
      formatter: (params: any) => {
        return params.map((p: any) => `${p.seriesName}: $${(p.value / 1e6).toFixed(1)}M`).join('<br/>')
      }
    },
    grid: {
      left: 60,
      right: 20,
      top: 20,
      bottom: 30
    },
    xAxis: {
      type: 'category',
      data: ['24H'],
      axisLine: { lineStyle: { color: '#30363D' } },
      axisLabel: { color: '#8B949E' }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#30363D', type: 'dashed' } },
      axisLabel: {
        color: '#8B949E',
        formatter: (v: number) => `$${(v / 1e6).toFixed(0)}M`
      }
    },
    series: [
      {
        name: '多头清算',
        type: 'bar',
        stack: 'total',
        data: [long],
        itemStyle: { color: '#3FB950' }
      },
      {
        name: '空头清算',
        type: 'bar',
        stack: 'total',
        data: [short],
        itemStyle: { color: '#F85149' }
      }
    ]
  }), [long, short])
  
  return <ReactECharts option={option} style={{ height: 150 }} />
}
