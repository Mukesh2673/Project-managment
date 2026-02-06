export type TicketStatus = 'todo' | 'in-progress' | 'review' | 'done'

export interface Ticket {
  id: string
  title: string
  description: string
  status: TicketStatus
  priority: 'low' | 'medium' | 'high'
  assignee?: string
  createdAt: Date
  updatedAt: Date
}

export interface StatusColumn {
  id: TicketStatus
  title: string
  color: string
}
