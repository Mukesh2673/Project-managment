'use client'

import { Ticket, TicketStatus } from '@/types'
import { StatusColumn as StatusColumnType } from '@/types'
import TicketCard from './TicketCard'
import { Plus } from 'lucide-react'
import { useDroppable } from '@dnd-kit/core'

interface StatusColumnProps {
  column: StatusColumnType
  tickets: Ticket[]
  onEdit: (ticket: Ticket) => void
  onDelete: (id: string) => void
  onStatusChange: (ticketId: string, newStatus: TicketStatus) => void
  onCreateTicket: (status: TicketStatus) => void
}

export default function StatusColumn({
  column,
  tickets,
  onEdit,
  onDelete,
  onStatusChange,
  onCreateTicket,
}: StatusColumnProps) {
  const columnTickets = tickets.filter((ticket) => ticket.status === column.id)
  
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  })

  return (
    <div className="flex flex-col h-full min-w-[300px]">
      <div className={`${column.color} rounded-t-lg p-4 mb-4`}>
        <div className="flex justify-between items-center">
          <h2 className="text-white font-bold text-lg">
            {column.title}
          </h2>
          <span className="bg-white/20 text-white px-2 py-1 rounded-full text-sm font-medium">
            {columnTickets.length}
          </span>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto space-y-3 pb-4 transition-colors rounded-lg min-h-[200px] ${
          isOver ? 'bg-blue-500/20 border-2 border-blue-500 border-dashed' : ''
        }`}
      >
        {columnTickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
        
        {columnTickets.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-sm">
            {isOver ? 'Drop ticket here' : 'No tickets in this column'}
          </div>
        )}
      </div>

      <button
        onClick={() => onCreateTicket(column.id)}
        className="mt-4 w-full py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Add Ticket
      </button>
    </div>
  )
}
