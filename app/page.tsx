'use client'

import { useState, useEffect } from 'react'
import { Ticket, TicketStatus } from '@/types'
import { STATUS_COLUMNS, PRIORITY_COLORS } from '@/lib/constants'
import StatusColumn from '@/components/StatusColumn'
import TicketModal from '@/components/TicketModal'
import { Plus, Filter, Loader2 } from 'lucide-react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { fetchTickets, createTicket, updateTicket, deleteTicket, updateTicketStatus } from '@/lib/api'

export default function Home() {
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
      if (editingTicket) {
        // Update existing ticket
        const updatedTicket = await updateTicket(editingTicket.id, ticketData)
        setTickets((prev) =>
          prev.map((ticket) =>
            ticket.id === editingTicket.id ? updatedTicket : ticket
          )
        )
      } else {
        // Create new ticket
        const newTicket = await createTicket(ticketData)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading tickets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-300">
            <p>{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Project Management
              </h1>
              <p className="text-slate-400">
                Organize and track your project tickets
              </p>
            </div>
            <button
              onClick={() => {
                setEditingTicket(undefined)
                setIsModalOpen(true)
              }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              New Ticket
            </button>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-slate-400" />
            <div className="flex gap-2">
              <button
                onClick={() => setFilterPriority('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterPriority === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterPriority('high')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterPriority === 'high'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                High Priority
              </button>
              <button
                onClick={() => setFilterPriority('medium')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterPriority === 'medium'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Medium Priority
              </button>
              <button
                onClick={() => setFilterPriority('low')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterPriority === 'low'
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Low Priority
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
          <div className="flex gap-6 overflow-x-auto pb-4">
            {STATUS_COLUMNS.map((column) => (
              <StatusColumn
                key={column.id}
                column={column}
                tickets={filteredTickets}
                onEdit={handleEditTicket}
                onDelete={handleDeleteTicket}
                onStatusChange={handleStatusChange}
                onCreateTicket={handleCreateTicket}
              />
            ))}
          </div>
          <DragOverlay>
            {activeId ? (() => {
              const activeTicket = tickets.find((t) => t.id === activeId)
              if (!activeTicket) return null
              return (
                <div className="bg-slate-800 rounded-lg p-4 shadow-2xl border-2 border-blue-500 rotate-2 w-72">
                  <div className="font-semibold text-white text-lg mb-2">
                    {activeTicket.title}
                  </div>
                  <p className="text-slate-300 text-sm line-clamp-2">
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
    </div>
  )
}
