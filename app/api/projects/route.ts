import { NextRequest, NextResponse } from 'next/server'
import { getProjectsByUserId, createProject } from '@/lib/projects'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { initializeDatabase } from '@/lib/db'

// Route segment config
export const dynamic = 'force-dynamic'
export const revalidate = 0

let dbInitialized = false
async function ensureDbInitialized() {
  if (!dbInitialized) {
    try {
      await initializeDatabase()
      dbInitialized = true
    } catch (error: any) {
      console.error('Database initialization error:', error)
      throw new Error(`Database connection failed: ${error.message}`)
    }
  }
}

// GET /api/projects - Get all projects for the current user
export async function GET(request: NextRequest) {
  try {
    await ensureDbInitialized()
    
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    const projects = await getProjectsByUserId(user.id)
    
    const response = NextResponse.json({
      success: true,
      data: projects,
    })
    
    // Cache control - short cache for projects
    response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60')
    
    return response
  } catch (error: any) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    await ensureDbInitialized()
    
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Project name is required' },
        { status: 400 }
      )
    }

    const project = await createProject({
      name: name.trim(),
      description: description?.trim() || undefined,
      ownerId: user.id,
      status: 'active',
    })

    return NextResponse.json({
      success: true,
      data: project,
    })
  } catch (error: any) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create project' },
      { status: 500 }
    )
  }
}
