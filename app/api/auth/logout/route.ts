import { NextRequest, NextResponse } from 'next/server'

// Route segment config
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    })

    // Clear the auth token cookie - multiple methods to ensure it's deleted
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 0,
      path: '/',
    }

    // Delete cookie using set with empty value and maxAge 0
    response.cookies.set('auth-token', '', cookieOptions)
    
    // Also try deleting with expires in the past
    response.cookies.set('auth-token', '', {
      ...cookieOptions,
      expires: new Date(0),
    })

    return response
  } catch (error: any) {
    console.error('Error during logout:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Logout failed' },
      { status: 500 }
    )
  }
}
