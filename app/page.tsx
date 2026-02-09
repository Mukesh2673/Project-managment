'use client'

import { useState, useEffect } from 'react'
import { Ticket, TicketStatus } from '@/types'
import { STATUS_COLUMNS, PRIORITY_COLORS } from '@/lib/constants'
import StatusColumn from '@/components/StatusColumn'
import TicketModal from '@/components/TicketModal'
import UserManagement from '@/components/UserManagement'
import { useAuth } from '@/lib/auth-context'
import { Plus, Filter, Loader2, LogOut, Users, User as UserIcon, Menu, X, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { fetchTickets, createTicket, updateTicket, deleteTicket, updateTicketStatus } from '@/lib/api'

// Auth Page Component
function AuthPage({ 
  isLogin, 
  setIsLogin, 
  login, 
  signup 
}: { 
  isLogin: boolean
  setIsLogin: (value: boolean) => void
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        await login(email, password)
      } else {
        if (password !== confirmPassword) {
          setError('Passwords do not match')
          setLoading(false)
          return
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters')
          setLoading(false)
          return
        }
        await signup(email, password, name)
      }
      // Reset form
      setEmail('')
      setPassword('')
      setName('')
      setConfirmPassword('')
    } catch (err: any) {
      setError(err.message || (isLogin ? 'Login failed' : 'Signup failed'))
    } finally {
      setLoading(false)
    }
  }

  const switchMode = () => {
    setIsLogin(!isLogin)
    setError('')
    setEmail('')
    setPassword('')
    setName('')
    setConfirmPassword('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-6 lg:gap-8">
        {/* Left Side - Welcome/Info */}
        <div className="hidden md:flex flex-col justify-center space-y-6 text-white animate-fade-in">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              Welcome Back
            </h2>
            <p className="text-blue-200 text-lg">
              {isLogin 
                ? 'Sign in to manage your projects and collaborate with your team.'
                : 'Create your account and start organizing your work efficiently.'}
            </p>
          </div>
          <div className="space-y-3 pt-8">
            <div className="flex items-center gap-3 text-blue-200">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>Secure authentication</span>
            </div>
            <div className="flex items-center gap-3 text-blue-200">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>Real-time collaboration</span>
            </div>
            <div className="flex items-center gap-3 text-blue-200">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>Easy project management</span>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8 lg:p-10 animate-scale-in">
            <div className="mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                {isLogin ? 'Sign In' : 'Create Account'}
              </h1>
              <p className="text-blue-200 text-sm">
                {isLogin 
                  ? 'Enter your credentials to access your account'
                  : 'Fill in your details to get started'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-4 bg-red-500/20 backdrop-blur-sm border border-red-500/50 rounded-xl text-red-200 text-sm animate-fade-in">
                  <div className="font-semibold mb-2 text-red-100">⚠️ Error</div>
                  <div className="whitespace-pre-line text-xs leading-relaxed">
                    {error.includes('Database connection failed') || error.includes('Cannot resolve database hostname') ? (
                      <div className="space-y-2">
                        <p className="font-medium">{error.split('\n')[0]}</p>
                        <div className="mt-3 p-3 bg-red-600/20 rounded-lg border border-red-500/30">
                          <p className="font-semibold text-red-100 mb-2">Quick Fix:</p>
                          <ol className="list-decimal list-inside space-y-1 text-xs">
                            <li>Go to <a href="https://console.aiven.io" target="_blank" rel="noopener noreferrer" className="underline hover:text-red-100">Aiven Dashboard</a></li>
                            <li>Check if your MySQL service is <strong>RUNNING</strong> (not paused)</li>
                            <li>If paused, click <strong>"Resume"</strong> to start the service</li>
                            <li>Verify the hostname matches your .env file</li>
                          </ol>
                        </div>
                        <details className="mt-2">
                          <summary className="cursor-pointer text-red-300 hover:text-red-100 text-xs">Show full error details</summary>
                          <pre className="mt-2 text-xs bg-black/30 p-2 rounded overflow-auto max-h-40">{error}</pre>
                        </details>
                      </div>
                    ) : (
                      error
                    )}
                  </div>
                </div>
              )}

              {!isLogin && (
                <div className="animate-fade-in">
                  <label className="block text-sm font-semibold text-blue-100 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-300 pointer-events-none z-10" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <label className="block text-sm font-semibold text-blue-100 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-300 pointer-events-none z-10" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <label className="block text-sm font-semibold text-blue-100 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-300 pointer-events-none z-10" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-white transition-colors z-10"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
                  <label className="block text-sm font-semibold text-blue-100 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-300 pointer-events-none z-10" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-white transition-colors z-10"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-4 space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading 
                    ? (isLogin ? 'Signing in...' : 'Creating account...')
                    : (isLogin ? 'Sign In' : 'Create Account')}
                </button>

                <button
                  type="button"
                  onClick={switchMode}
                  className="w-full px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/20 text-blue-200 rounded-xl font-medium transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  {isLogin 
                    ? "Don't have an account? Sign Up"
                    : 'Already have an account? Sign In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const { user, loading: authLoading, logout, login, signup } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [showUserManagement, setShowUserManagement] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTicket, setEditingTicket] = useState<Ticket | undefined>()
  const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high'>('all')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Load tickets from API on mount
  useEffect(() => {
    loadTickets()
  }, [])

  const loadTickets = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchTickets()
      setTickets(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tickets')
      console.error('Error loading tickets:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTicket = (status: TicketStatus) => {
    setEditingTicket(undefined)
    setIsModalOpen(true)
  }

  const handleSaveTicket = async (ticketData: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setError(null)
      const ticketWithUser = {
        ...ticketData,
        createdBy: user?.id,
      }
      
      if (editingTicket) {
        // Update existing ticket
        const updatedTicket = await updateTicket(editingTicket.id, ticketWithUser)
        setTickets((prev) =>
          prev.map((ticket) =>
            ticket.id === editingTicket.id ? updatedTicket : ticket
          )
        )
      } else {
        // Create new ticket
        const newTicket = await createTicket(ticketWithUser)
        setTickets((prev) => [...prev, newTicket])
      }
      setIsModalOpen(false)
      setEditingTicket(undefined)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save ticket')
      console.error('Error saving ticket:', err)
    }
  }

  const handleEditTicket = (ticket: Ticket) => {
    setEditingTicket(ticket)
    setIsModalOpen(true)
  }

  const handleDeleteTicket = async (id: string) => {
    if (confirm('Are you sure you want to delete this ticket?')) {
      try {
        setError(null)
        await deleteTicket(id)
        setTickets((prev) => prev.filter((ticket) => ticket.id !== id))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete ticket')
        console.error('Error deleting ticket:', err)
      }
    }
  }

  const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    try {
      setError(null)
      const updatedTicket = await updateTicketStatus(ticketId, newStatus)
      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === ticketId ? updatedTicket : ticket
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update ticket status')
      console.error('Error updating ticket status:', err)
      // Reload tickets to sync state
      loadTickets()
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const ticketId = active.id as string
    const newStatus = over.id as TicketStatus

    // Only update if status actually changed
    const ticket = tickets.find((t) => t.id === ticketId)
    if (ticket && ticket.status !== newStatus) {
      await handleStatusChange(ticketId, newStatus)
    }
  }

  const filteredTickets = filterPriority === 'all' 
    ? tickets 
    : tickets.filter(ticket => ticket.priority === filterPriority)

  const handleLogout = async () => {
    await logout()
    setShowUserManagement(false)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthPage isLogin={isLogin} setIsLogin={setIsLogin} login={login} signup={signup} />
  }

  if (showUserManagement) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          <div className="mb-6">
            <button
              onClick={() => setShowUserManagement(false)}
              className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2 mb-4"
            >
              ← Back to Dashboard
            </button>
          </div>
          <UserManagement />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-500/20 backdrop-blur-sm border border-red-500/50 rounded-lg sm:rounded-xl text-red-300 animate-fade-in shadow-lg">
            <p className="text-sm sm:text-base">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 sm:mt-3 text-xs sm:text-sm underline hover:text-red-200 transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Header */}
        <div className="mb-6 md:mb-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div className="animate-slide-in">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Project Management
              </h1>
              <p className="text-slate-400 text-sm sm:text-base">
                Organize and track your project tickets
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-all duration-200 border border-slate-700"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline text-white text-sm font-medium">{user.name}</span>
                  <Menu className="w-4 h-4 text-slate-400 sm:hidden" />
                </button>
                
                {/* Dropdown Menu */}
                {showMobileMenu && (
                  <div className="absolute right-0 mt-2 w-48 sm:w-56 bg-slate-800 rounded-lg shadow-xl border border-slate-700 z-50 animate-scale-in">
                    <div className="p-3 border-b border-slate-700">
                      <div className="text-white font-medium text-sm">{user.name}</div>
                      <div className="text-slate-400 text-xs">{user.email}</div>
                      <div className="mt-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          user.role === 'admin' ? 'bg-purple-500/20 text-purple-300' :
                          user.role === 'user' ? 'bg-blue-500/20 text-blue-300' :
                          'bg-green-500/20 text-green-300'
                        }`}>
                          {user.role}
                        </span>
                      </div>
                    </div>
                    <div className="p-2">
                      {(user.role === 'admin') && (
                        <button
                          onClick={() => {
                            setShowUserManagement(true)
                            setShowMobileMenu(false)
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left text-slate-300 hover:bg-slate-700 rounded-lg transition-colors text-sm"
                        >
                          <Users className="w-4 h-4" />
                          Manage Users
                        </button>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left text-red-400 hover:bg-red-500/20 rounded-lg transition-colors text-sm"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => {
                  setEditingTicket(undefined)
                  setIsModalOpen(true)
                }}
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 animate-scale-in"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">New Ticket</span>
                <span className="sm:hidden">New</span>
              </button>
            </div>
          </div>

          {/* Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 animate-fade-in">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
              <span className="text-sm sm:text-base text-slate-400 font-medium">Filter:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterPriority('all')}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all duration-300 text-sm sm:text-base font-medium ${
                  filterPriority === 'all'
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:scale-105 active:scale-95'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterPriority('high')}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all duration-300 text-sm sm:text-base font-medium ${
                  filterPriority === 'high'
                    ? 'bg-red-600 text-white shadow-lg scale-105'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:scale-105 active:scale-95'
                }`}
              >
                High
              </button>
              <button
                onClick={() => setFilterPriority('medium')}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all duration-300 text-sm sm:text-base font-medium ${
                  filterPriority === 'medium'
                    ? 'bg-yellow-600 text-white shadow-lg scale-105'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:scale-105 active:scale-95'
                }`}
              >
                Medium
              </button>
              <button
                onClick={() => setFilterPriority('low')}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all duration-300 text-sm sm:text-base font-medium ${
                  filterPriority === 'low'
                    ? 'bg-green-600 text-white shadow-lg scale-105'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:scale-105 active:scale-95'
                }`}
              >
                Low
              </button>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
            {STATUS_COLUMNS.map((column, index) => (
              <div
                key={column.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <StatusColumn
                  column={column}
                  tickets={filteredTickets}
                  onEdit={handleEditTicket}
                  onDelete={handleDeleteTicket}
                  onStatusChange={handleStatusChange}
                  onCreateTicket={handleCreateTicket}
                />
              </div>
            ))}
          </div>
          <DragOverlay>
            {activeId ? (() => {
              const activeTicket = tickets.find((t) => t.id === activeId)
              if (!activeTicket) return null
              return (
                <div className="bg-slate-800 rounded-lg p-4 shadow-2xl border-2 border-blue-500 rotate-2 w-64 sm:w-72 transform scale-105 animate-pulse-glow">
                  <div className="font-semibold text-white text-base sm:text-lg mb-2">
                    {activeTicket.title}
                  </div>
                  <p className="text-slate-300 text-xs sm:text-sm line-clamp-2">
                    {activeTicket.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${PRIORITY_COLORS[activeTicket.priority]}`}>
                      {activeTicket.priority}
                    </span>
                  </div>
                </div>
              )
            })() : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Ticket Modal */}
      <TicketModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingTicket(undefined)
        }}
        onSave={handleSaveTicket}
        ticket={editingTicket}
      />
      
      {/* Click outside to close mobile menu */}
      {showMobileMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMobileMenu(false)}
        />
      )}
    </div>
  )
}
