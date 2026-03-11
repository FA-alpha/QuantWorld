import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ConsolePage from './pages/ConsolePage'
import SimulationPage from './pages/SimulationPage'
import SimulationProcessPage from './pages/SimulationProcessPage'
import ReportPage from './pages/ReportPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="console" element={<ConsolePage />} />
        <Route path="simulation/:id" element={<SimulationPage />} />
        <Route path="report/:id" element={<ReportPage />} />
      </Route>
      {/* 全屏页面（不使用 Layout） */}
      <Route path="/process/:id" element={<SimulationProcessPage />} />
    </Routes>
  )
}
