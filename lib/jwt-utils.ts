import * as jose from 'jose'
import * as bcrypt from 'bcryptjs'

// JWT configuration constants
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production'
const ACCESS_TOKEN_EXPIRY = '15m' // Short-lived access token for security
const REFRESH_TOKEN_EXPIRY = '7d' // Longer-lived refresh token
const REFRESH_TOKEN_EXPIRY_DAYS = 7

// Interface for JWT payload
export interface JWTPayload {
  userId: string
  email: string
  fullName: string
  iat?: number
  exp?: number
}

// Interface for refresh token payload
export interface RefreshTokenPayload {
  userId: string
  tokenId: string
  iat?: number
  exp?: number
}

/**
 * Generate a new access token for a user
 * @param payload - User data to include in the token
 * @returns JWT access token
 */
export async function generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET)
  
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .setIssuer('swiftly-app')
    .setAudience('swiftly-users')
    .sign(secret)
}

/**
 * Generate a new refresh token for a user
 * @param userId - User ID
 * @param tokenId - Unique token identifier for revocation
 * @returns JWT refresh token
 */
export async function generateRefreshToken(userId: string, tokenId: string): Promise<string> {
  const secret = new TextEncoder().encode(JWT_REFRESH_SECRET)
  
  return await new jose.SignJWT({ userId, tokenId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .setIssuer('swiftly-app')
    .setAudience('swiftly-users')
    .sign(secret)
}

/**
 * Verify and decode an access token
 * @param token - JWT access token
 * @returns Decoded token payload or null if invalid
 */
export async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jose.jwtVerify(token, secret, {
      issuer: 'swiftly-app',
      audience: 'swiftly-users'
    })
    
    // Cast the payload to our custom type
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      fullName: payload.fullName as string,
      iat: payload.iat as number,
      exp: payload.exp as number
    }
  } catch (error) {
    console.error('Access token verification failed:', error)
    return null
  }
}

/**
 * Verify and decode a refresh token
 * @param token - JWT refresh token
 * @returns Decoded refresh token payload or null if invalid
 */
export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
  try {
    const secret = new TextEncoder().encode(JWT_REFRESH_SECRET)
    const { payload } = await jose.jwtVerify(token, secret, {
      issuer: 'swiftly-app',
      audience: 'swiftly-users'
    })
    
    // Cast the payload to our custom type
    return {
      userId: payload.userId as string,
      tokenId: payload.tokenId as string,
      iat: payload.iat as number,
      exp: payload.exp as number
    }
  } catch (error) {
    console.error('Refresh token verification failed:', error)
    return null
  }
}

/**
 * Hash a password using bcrypt
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12 // High salt rounds for security
  return bcrypt.hash(password, saltRounds)
}

/**
 * Compare a plain text password with a hashed password
 * @param password - Plain text password
 * @param hashedPassword - Hashed password to compare against
 * @returns True if passwords match, false otherwise
 */
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

/**
 * Generate a unique token ID for refresh token tracking
 * @returns Unique token identifier
 */
export function generateTokenId(): string {
  return `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Calculate expiration date for refresh tokens
 * @returns Date object representing when the token expires
 */
export function getRefreshTokenExpiry(): Date {
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + REFRESH_TOKEN_EXPIRY_DAYS)
  return expiryDate
}

/**
 * Check if a token is expired
 * @param token - JWT token to check
 * @returns True if expired, false otherwise
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jose.decodeJwt(token)
    if (!decoded || !decoded.exp) return true
    
    const currentTime = Math.floor(Date.now() / 1000)
    return decoded.exp < currentTime
  } catch {
    return true
  }
}
