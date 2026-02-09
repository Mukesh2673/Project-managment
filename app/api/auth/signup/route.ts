import { NextRequest, NextResponse } from 'next/server'
import { createUser } from '@/lib/users'
import { generateToken } from '@/lib/auth'
import { initializeDatabase } from '@/lib/db'
import { createProject } from '@/lib/projects'

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
      // Re-throw with more context
      throw new Error(`Database connection failed: ${error.message}`)
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDbInitialized()
    const body = await request.json()
    const { email, password, name, role, projectName } = body

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    if (!projectName || !projectName.trim()) {
      return NextResponse.json(
        { success: false, error: 'Project name is required' },
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

    // Create the user's first project
    const project = await createProject({
      name: projectName.trim(),
      ownerId: user.id,
      status: 'active',
    })

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })

    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
        },
        project: {
          id: project.id,
          name: project.name,
        },
        token,
      },
    })

    // Set HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    // No cache for auth responses
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    return response
  } catch (error: any) {
    console.error('Error during signup:', error)
    
    // Format error message for better readability
    let errorMessage = error.message || 'Signup failed'
    
    // If it's a database connection error, format it nicely
    if (errorMessage.includes('Database connection failed') || errorMessage.includes('Cannot resolve database hostname')) {
      errorMessage = errorMessage
        .replace(/\\n/g, '\n') // Convert \n to actual newlines
        .split('\n')
        .filter((line: string) => line.trim()) // Remove empty lines
        .join('\n')
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
