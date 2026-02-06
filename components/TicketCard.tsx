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
      className={`bg-slate-800 rounded-lg p-4 shadow-lg hover:shadow-xl transition-all duration-200 border border-slate-700 hover:border-slate-600 ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div 
          {...attributes} 
          {...listeners}
          className="flex items-start gap-2 flex-1 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4 text-slate-500 mt-1 flex-shrink-0" />
          <h3 className="font-semibold text-white text-lg flex-1">{ticket.title}</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(ticket)
            }}
            className="p-1.5 hover:bg-slate-700 rounded transition-colors"
            aria-label="Edit ticket"
          >
            <Edit2 className="w-4 h-4 text-blue-400" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(ticket.id)
            }}
            className="p-1.5 hover:bg-slate-700 rounded transition-colors"
            aria-label="Delete ticket"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>
      
      <p className="text-slate-300 text-sm mb-3 line-clamp-2">{ticket.description}</p>
      
      <div className="flex items-center justify-between mt-4">
        <span className={`px-2 py-1 rounded text-xs font-medium border ${PRIORITY_COLORS[ticket.priority]}`}>
          {ticket.priority}
        </span>
        
        <div className="flex items-center gap-3 text-xs text-slate-400">
          {ticket.assignee && (
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>{ticket.assignee}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{format(new Date(ticket.createdAt), 'MMM d')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
