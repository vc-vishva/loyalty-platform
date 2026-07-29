/**
 * Token type embedded in the JWT payload. Kept as a local constant — the app
 * issues stateless access JWTs, so there is no Token table.
 */
export const tokenTypes = {
  ACCESS: 'access',
} as const;

export type TokenType = (typeof tokenTypes)[keyof typeof tokenTypes];
