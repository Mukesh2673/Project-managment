'use client'

import { Ticket } from '@/types'
import { PRIORITY_COLORS } from '@/lib/constants'
import { Calendar, User, Edit2, Trash2, GripVertical } from 'lucide-react'
import { format } from 'date-fns'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

interface TicketCardProps {
  ticket: Ticket
  onEdit: (ticket: Ticket) => void
  onDelete: (id: string) => void
}

export default function TicketCard({ ticket, onEdit, onDelete }: TicketCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: ticket.id,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-xl p-3 sm:p-4 shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-700 hover:border-blue-500/50 hover:scale-[1.02] ${
        isDragging ? 'opacity-50 scale-95 rotate-2' : 'animate-fade-in'
      } backdrop-blur-sm`}
    >
      <div className="flex justify-between items-start mb-2 gap-2">
        <div 
          {...attributes} 
          {...listeners}
          className="flex items-start gap-2 flex-1 cursor-grab active:cursor-grabbing min-w-0"
        >
          <GripVertical className="w-4 h-4 text-slate-500 mt-1 flex-shrink-0 group-hover:text-blue-400 transition-colors" />
          <h3 className="font-semibold text-white text-base sm:text-lg flex-1 truncate group-hover:text-blue-300 transition-colors">
            {ticket.title}
          </h3>
        </div>
        <div className="flex gap-1 sm:gap-2 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(ticket)
            }}
            className="p-1.5 sm:p-2 hover:bg-blue-500/20 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
            aria-label="Edit ticket"
          >
            <Edit2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 hover:text-blue-300" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(ticket.id)
            }}
            className="p-1.5 sm:p-2 hover:bg-red-500/20 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
            aria-label="Delete ticket"
          >
            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 hover:text-red-300" />
          </button>
        </div>
      </div>
      
      <p className="text-slate-300 text-xs sm:text-sm mb-3 line-clamp-2 sm:line-clamp-3 leading-relaxed">
        {ticket.description}
      </p>
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mt-4 pt-3 border-t border-slate-700/50">
        <span className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-medium border transition-all duration-200 hover:scale-105 ${PRIORITY_COLORS[ticket.priority]}`}>
          {ticket.priority}
        </span>
        
        <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-400">
          {ticket.assignee && (
            <div className="flex items-center gap-1 bg-slate-700/50 px-2 py-1 rounded-md">
              <User className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="truncate max-w-[80px] sm:max-w-none">{ticket.assignee}</span>
            </div>
          )}
          <div className="flex items-center gap-1 bg-slate-700/50 px-2 py-1 rounded-md">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{format(new Date(ticket.createdAt), 'MMM d, yyyy')}</span>
            <span className="sm:hidden">{format(new Date(ticket.createdAt), 'MMM d')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
