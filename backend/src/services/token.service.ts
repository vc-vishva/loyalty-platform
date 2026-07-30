import jwt from 'jsonwebtoken';
import httpStatus from 'http-status';
import { Role, User, RefreshToken } from '@prisma/client';
import prisma from '../config/prisma.js';
import config from '../config/config.js';
import ApiError from '../utils/ApiError.js';
import { errorMessages } from '../config/messages.js';
import { tokenTypes, TokenType } from '../config/tokens.js';
import { AuthTokens } from '../types/auth.type.js';

export interface TokenPayload {
  sub: string;
  role: Role;
  iat: number;
  exp: number;
  type: TokenType;
}

/** Sign a JWT for a user with the given type and expiry. */
const generateToken = (userId: string, role: Role, expires: Date, type: TokenType): string => {
  const payload = {
    sub: userId,
    role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(expires.getTime() / 1000),
    type,
  };
  return jwt.sign(payload, config.jwt.secret);
};

/**
 * Issue a fresh access + refresh token pair for a user. The refresh token is
 * persisted (RefreshToken model) so it can later be rotated or revoked.
 */
export const generateAuthTokens = async (user: User): Promise<AuthTokens> => {
  const accessExpires = new Date(Date.now() + config.jwt.accessExpirationMinutes * 60 * 1000);
  const refreshExpires = new Date(Date.now() + config.jwt.refreshExpirationDays * 24 * 60 * 60 * 1000);

  const accessToken = generateToken(user.id, user.role, accessExpires, tokenTypes.ACCESS);
  const refreshToken = generateToken(user.id, user.role, refreshExpires, tokenTypes.REFRESH);

  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: user.id, expiresAt: refreshExpires },
  });

  return {
    access: { token: accessToken, expires: accessExpires },
    refresh: { token: refreshToken, expires: refreshExpires },
  };
};

/**
 * Verify a refresh token: signature + type + it exists in the DB, is not revoked
 * and not expired. Returns the persisted record on success.
 */
export const verifyRefreshToken = async (token: string): Promise<RefreshToken> => {
  try {
    const payload = jwt.verify(token, config.jwt.secret) as TokenPayload;
    if (payload.type !== tokenTypes.REFRESH) {
      throw new Error('wrong token type');
    }
  } catch {
    throw new ApiError(httpStatus.UNAUTHORIZED, errorMessages.INVALID_REFRESH_TOKEN);
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token } });
  if (!stored || stored.revoked || stored.expiresAt.getTime() < Date.now()) {
    throw new ApiError(httpStatus.UNAUTHORIZED, errorMessages.INVALID_REFRESH_TOKEN);
  }
  return stored;
};

/**
 * Rotate a refresh token: verify the old one, revoke it, and issue a new pair.
 * Rotation means a stolen refresh token is single-use.
 */
export const rotateRefreshToken = async (token: string): Promise<AuthTokens> => {
  const stored = await verifyRefreshToken(token);
  const user = await prisma.user.findUnique({ where: { id: stored.userId } });
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, errorMessages.INVALID_REFRESH_TOKEN);
  }
  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
  return generateAuthTokens(user);
};

/** Revoke a refresh token (logout). Idempotent — unknown tokens are ignored. */
export const revokeRefreshToken = async (token: string): Promise<void> => {
  await prisma.refreshToken.updateMany({ where: { token }, data: { revoked: true } });
};

export default {
  generateAuthTokens,
  verifyRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
};
