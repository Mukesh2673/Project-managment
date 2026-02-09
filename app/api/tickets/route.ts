import { NextRequest, NextResponse } from 'next/server'
import { Ticket } from '@/types'
import { getTickets, createTicket, initializeDatabase } from '@/lib/db'

// Initialize database on first request
let dbInitialized = false
let dbInitializing = false
async function ensureDbInitialized() {
  if (dbInitialized) return
  if (dbInitializing) {
    // Wait for ongoing initialization
    while (dbInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    return
  }
  dbInitializing = true
  try {
    await initializeDatabase()
    dbInitialized = true
    console.log('Database initialization completed')
  } catch (error) {
    console.error('Database initialization failed:', error)
    throw error
  } finally {
    dbInitializing = false
  }
}

// GET /api/tickets - Get all tickets
export async function GET() {
  try {
    await ensureDbInitialized()
    const tickets = await getTickets()
    return NextResponse.json({ success: true, data: tickets })
  } catch (error) {
    console.error('Error fetching tickets:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tickets' },
      { status: 500 }
    )
  }
}

// POST /api/tickets - Create a new ticket
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, status, priority, assignee } = body

    // Validate required fields
    if (!title || !description || !status || !priority) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ['todo', 'in-progress', 'review', 'done']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high']
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { success: false, error: 'Invalid priority' },
        { status: 400 }
      )
    }

    const ticketData: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'> = {
      title,
      description,
      status,
      priority,
      assignee: assignee || undefined,
    }

    await ensureDbInitialized()
    const newTicket = await createTicket(ticketData)
    return NextResponse.json({ success: true, data: newTicket }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating ticket:', error)
    const errorMessage = error?.message || 'Failed to create ticket'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
