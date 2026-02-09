import { NextRequest, NextResponse } from 'next/server'
import { Ticket, TicketStatus } from '@/types'
import { getTicketById, updateTicket, deleteTicket, initializeDatabase } from '@/lib/db'

// Route segment config
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Initialize database on first request
let dbInitialized = false
async function ensureDbInitialized() {
  if (!dbInitialized) {
    await initializeDatabase()
    dbInitialized = true
  }
}

// GET /api/tickets/[id] - Get a single ticket
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDbInitialized()
    const { id } = await params
    const ticket = await getTicketById(id)
    
    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true, data: ticket })
  } catch (error) {
    console.error('Error fetching ticket:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ticket' },
      { status: 500 }
    )
  }
}

// PUT /api/tickets/[id] - Update a ticket
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, description, status, priority, assignee } = body

    // Validate status if provided
    if (status) {
      const validStatuses: TicketStatus[] = ['todo', 'in-progress', 'review', 'done']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, error: 'Invalid status' },
          { status: 400 }
        )
      }
    }

    // Validate priority if provided
    if (priority) {
      const validPriorities = ['low', 'medium', 'high']
      if (!validPriorities.includes(priority)) {
        return NextResponse.json(
          { success: false, error: 'Invalid priority' },
          { status: 400 }
        )
      }
    }

    const updateData: Partial<Omit<Ticket, 'id' | 'createdAt'>> = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (status !== undefined) updateData.status = status
    if (priority !== undefined) updateData.priority = priority
    if (assignee !== undefined) updateData.assignee = assignee || undefined

    await ensureDbInitialized()
    const updatedTicket = await updateTicket(id, updateData)
    
    if (!updatedTicket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true, data: updatedTicket })
  } catch (error) {
    console.error('Error updating ticket:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update ticket' },
      { status: 500 }
    )
  }
}

// DELETE /api/tickets/[id] - Delete a ticket
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDbInitialized()
    const { id } = await params
    const deleted = await deleteTicket(id)
    
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true, message: 'Ticket deleted successfully' })
  } catch (error) {
    console.error('Error deleting ticket:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete ticket' },
      { status: 500 }
    )
  }
}
