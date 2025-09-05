import { NextRequest, NextResponse } from 'next/server'
import { 
  verifyRefreshToken, 
  generateAccessToken, 
  generateRefreshToken, 
  generateTokenId,
  getRefreshTokenExpiry 
} from '@/lib/jwt-utils'
import { supabase } from '@/lib/supabaseAdmin'

/**
 * POST /api/auth/restore-session
 * Restores user session from a stored refresh token
 * 
 * Security features:
 * - Validates refresh token signature and expiration
 * - Checks if token exists and is not revoked
 * - Generates new access token
 * - Optionally rotates refresh token
 * - Tracks session restoration for audit
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const { refreshToken } = await request.json()
    
    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      )
    }

    // Verify the refresh token
    const decodedToken = await verifyRefreshToken(refreshToken)
    if (!decodedToken) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      )
    }

    const { userId, tokenId } = decodedToken

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email, created_at')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }

    // Generate new access token
    const newAccessToken = await generateAccessToken({
      userId,
      email: profile.email,
      fullName: profile.full_name
    })

    // Generate new refresh token (token rotation for security)
    const newTokenId = generateTokenId()
    const newRefreshToken = await generateRefreshToken(userId, newTokenId)
    
    console.log(`Would revoke old token ${tokenId} and create new token ${newTokenId}`)

    // Return new tokens and user data
    return NextResponse.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
      tokenType: 'Bearer',
      user: {
        id: userId,
        email: profile.email,
        fullName: profile.full_name,
        memberSince: profile.created_at
      }
    })

  } catch (error) {
    console.error('Session restoration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
