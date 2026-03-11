import { Outlet, Link, useLocation } from 'react-router-dom'
import { Activity, Home, Terminal } from 'lucide-react'

export default function Layout() {
  const location = useLocation()
  
  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/console', icon: Terminal, label: 'Console' },
  ]
  
  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="border-b border-border bg-card-bg">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold">
            <Activity className="text-accent-blue" />
            <span>QuantWorld</span>
          </Link>
          
          <nav className="flex gap-4">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition
                  ${location.pathname === item.path 
                    ? 'bg-accent-blue/20 text-accent-blue' 
                    : 'text-text-secondary hover:text-text-primary'}`}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
