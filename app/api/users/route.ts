import { NextRequest, NextResponse } from 'next/server'
import { getUsers, createUser } from '@/lib/users'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { initializeDatabase } from '@/lib/db'

// Route segment config
export const dynamic = 'force-dynamic'
export const revalidate = 0

let dbInitialized = false
async function ensureDbInitialized() {
  if (!dbInitialized) {
    await initializeDatabase()
    dbInitialized = true
  }
}

// Middleware to check authentication and authorization
async function requireAuth(request: NextRequest, requireAdmin = false) {
  const token = getTokenFromRequest(request)
  
  if (!token) {
    return { error: 'Not authenticated', status: 401, user: null }
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    return { error: 'Invalid token', status: 401, user: null }
  }

  if (requireAdmin && decoded.role !== 'admin') {
    return { error: 'Admin access required', status: 403, user: null }
  }

  return { error: null, status: 200, user: decoded }
}

// GET /api/users - Get all users
export async function GET(request: NextRequest) {
  try {
    await ensureDbInitialized()
    const auth = await requireAuth(request)
    
    if (auth.error) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      )
    }

    const users = await getUsers()
    return NextResponse.json({ success: true, data: users })
  } catch (error: any) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST /api/users - Create a new user (admin only)
export async function POST(request: NextRequest) {
  try {
    await ensureDbInitialized()
    const auth = await requireAuth(request, true) // Require admin
    
    if (auth.error) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      )
    }

    const body = await request.json()
    const { email, password, name, role } = body

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const user = await createUser({
      email,
      password,
      name,
      role: role || 'user',
    })

    return NextResponse.json({ success: true, data: user }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create user' },
      { status: 500 }
    )
  }
}
