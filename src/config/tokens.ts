import { TokenType } from '@prisma/client';

/**
 * Re-export Prisma's generated TokenType enum, plus an uppercase-keyed alias so
 * existing call sites (tokenTypes.ACCESS / tokenTypes.REFRESH) keep working.
 */
export { TokenType };

export const tokenTypes = {
  ACCESS: TokenType.access,
  REFRESH: TokenType.refresh,
} as const;
