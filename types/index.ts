export type TicketStatus = 'todo' | 'in-progress' | 'review' | 'done'
export type UserRole = 'admin' | 'user' | 'viewer'

export interface Ticket {
  id: string
  title: string
  description: string
  status: TicketStatus
  priority: 'low' | 'medium' | 'high'
  assignee?: string
  assigneeId?: string
  createdBy?: string
  createdAt: Date
  updatedAt: Date
}

export interface StatusColumn {
  id: TicketStatus
  title: string
  color: string
}

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
  createdAt: Date
  updatedAt: Date
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
}
