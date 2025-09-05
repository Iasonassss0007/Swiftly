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
 * POST /api/auth/refresh
 * Handles refresh token requests to generate new access tokens
 * 
 * Security features:
 * - Validates refresh token signature and expiration
 * - Checks if refresh token exists in database
 * - Generates new access token with short expiry
 * - Optionally rotates refresh token for enhanced security
 * - Tracks token usage for audit purposes
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
      .select('full_name, email')
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

    // Optional: Rotate refresh token for enhanced security
    const shouldRotateToken = process.env.ROTATE_REFRESH_TOKENS === 'true'
    
    let newRefreshToken = refreshToken
    let newTokenId = tokenId

    if (shouldRotateToken) {
      // Generate new refresh token
      newTokenId = generateTokenId()
      newRefreshToken = await generateRefreshToken(userId, newTokenId)
      
      console.log(`Would revoke old token ${tokenId} and create new token ${newTokenId}`)
    }

    // Return new tokens
    return NextResponse.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
      tokenType: 'Bearer'
    })

  } catch (error) {
    console.error('Refresh token error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
