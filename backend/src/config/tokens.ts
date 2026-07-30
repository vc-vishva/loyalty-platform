/**
 * Token types embedded in the JWT payload. The API issues a short-lived ACCESS
 * token and a longer-lived REFRESH token; refresh tokens are also persisted in
 * the database (RefreshToken model) so they can be rotated and revoked.
 */
export const tokenTypes = {
  ACCESS: 'access',
  REFRESH: 'refresh',
} as const;

export type TokenType = (typeof tokenTypes)[keyof typeof tokenTypes];
