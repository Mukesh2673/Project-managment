import { NextRequest, NextResponse } from 'next/server'
import { verifyUserCredentials } from '@/lib/users'
import { generateToken } from '@/lib/auth'
import { initializeDatabase } from '@/lib/db'

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
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const user = await verifyUserCredentials(email, password)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

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
        token,
      },
    })

    // Set HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error: any) {
    console.error('Error during login:', error)
    
    // Format error message for better readability
    let errorMessage = error.message || 'Login failed'
    
    // If it's a database connection error, format it nicely
    if (errorMessage.includes('Database connection failed') || errorMessage.includes('Cannot resolve database hostname')) {
      errorMessage = errorMessage
        .replace(/\\n/g, '\n') // Convert \n to actual newlines
        .split('\n')
        .filter(line => line.trim()) // Remove empty lines
        .join('\n')
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
