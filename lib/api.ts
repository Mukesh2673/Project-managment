import { Ticket, TicketStatus } from '@/types'

const API_BASE_URL = '/api/tickets'

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Fetch all tickets
export async function fetchTickets(): Promise<Ticket[]> {
  try {
    const response = await fetch(API_BASE_URL)
    const result: ApiResponse<Ticket[]> = await response.json()
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to fetch tickets')
    }
    
    // Convert date strings to Date objects
    return result.data.map((ticket) => ({
      ...ticket,
      createdAt: new Date(ticket.createdAt),
      updatedAt: new Date(ticket.updatedAt),
    }))
  } catch (error) {
    console.error('Error fetching tickets:', error)
    throw error
  }
}

// Create a new ticket
export async function createTicket(
  ticketData: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Ticket> {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ticketData),
    })
    
    const result: ApiResponse<Ticket> = await response.json()
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to create ticket')
    }
    
    return {
      ...result.data,
      createdAt: new Date(result.data.createdAt),
      updatedAt: new Date(result.data.updatedAt),
    }
  } catch (error) {
    console.error('Error creating ticket:', error)
    throw error
  }
}

// Update a ticket
export async function updateTicket(
  id: string,
  ticketData: Partial<Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Ticket> {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ticketData),
    })
    
    const result: ApiResponse<Ticket> = await response.json()
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to update ticket')
    }
    
    return {
      ...result.data,
      createdAt: new Date(result.data.createdAt),
      updatedAt: new Date(result.data.updatedAt),
    }
  } catch (error) {
    console.error('Error updating ticket:', error)
    throw error
  }
}

// Delete a ticket
export async function deleteTicket(id: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
    })
    
    const result: ApiResponse<void> = await response.json()
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete ticket')
    }
  } catch (error) {
    console.error('Error deleting ticket:', error)
    throw error
  }
}

// Update ticket status (convenience function)
export async function updateTicketStatus(
  id: string,
  status: TicketStatus
): Promise<Ticket> {
  return updateTicket(id, { status })
}
