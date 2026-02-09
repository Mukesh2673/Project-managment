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
    <div className="flex flex-col h-full min-w-[280px] sm:min-w-[300px] md:min-w-[320px] animate-fade-in">
      <div className={`${column.color} rounded-t-xl sm:rounded-t-lg p-3 sm:p-4 mb-3 sm:mb-4 shadow-lg transition-all duration-300 hover:shadow-xl`}>
        <div className="flex justify-between items-center">
          <h2 className="text-white font-bold text-base sm:text-lg md:text-xl">
            {column.title}
          </h2>
          <span className="bg-white/20 backdrop-blur-sm text-white px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold min-w-[28px] text-center transition-all duration-300 hover:scale-110">
            {columnTickets.length}
          </span>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto space-y-3 sm:space-y-4 pb-4 transition-all duration-300 rounded-lg min-h-[200px] sm:min-h-[300px] px-1 ${
          isOver 
            ? 'bg-blue-500/20 border-2 border-blue-500 border-dashed scale-[1.02]' 
            : 'bg-slate-800/30'
        }`}
      >
        {columnTickets.map((ticket, index) => (
          <div
            key={ticket.id}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <TicketCard
              ticket={ticket}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        ))}
        
        {columnTickets.length === 0 && (
          <div className={`text-center py-8 sm:py-12 text-slate-500 text-sm sm:text-base transition-all duration-300 ${
            isOver ? 'text-blue-400 font-medium scale-105' : ''
          }`}>
            {isOver ? (
              <div className="animate-pulse">
                <div className="text-lg mb-2">✨</div>
                <div>Drop ticket here</div>
              </div>
            ) : (
              <div className="opacity-60">
                <div className="text-2xl mb-2">📋</div>
                <div>No tickets in this column</div>
              </div>
            )}
          </div>
        )}
      </div>

      <button
        onClick={() => onCreateTicket(column.id)}
        className="mt-3 sm:mt-4 w-full py-2.5 sm:py-3 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 rounded-lg sm:rounded-xl text-white font-medium transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 text-sm sm:text-base"
      >
        <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="hidden sm:inline">Add Ticket</span>
        <span className="sm:hidden">Add</span>
      </button>
    </div>
  )
}
