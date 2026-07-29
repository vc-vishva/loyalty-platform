import jwt from 'jsonwebtoken';
import moment, { Moment } from 'moment';
import { Token, User } from '@prisma/client';
import config from '../config/config.js';
import prisma from '../config/prisma.js';
import { tokenTypes, TokenType } from '../config/tokens.js';

export interface TokenPayload {
  id: string;
  iat: number;
  exp: number;
  type: TokenType;
}

export interface TokenInfo {
  token: string;
  expires: Date;
}

export interface AuthTokens {
  access: TokenInfo;
  refresh: TokenInfo;
}

/**
 * Generate a signed JWT.
 */
export const generateToken = (
  userId: string,
  expires: Moment,
  type: TokenType,
  secret: string = config.jwt.secret
): string => {
  const payload = {
    id: userId,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
  };
  return jwt.sign(payload, secret);
};

/**
 * Persist a token document.
 */
export const saveToken = async (
  token: string,
  userId: string,
  expires: Moment,
  type: TokenType,
  blacklisted = false
): Promise<Token> => {
  return prisma.token.create({
    data: {
      token,
      userId,
      expires: expires.toDate(),
      type,
      blacklisted,
    },
  });
};

/**
 * Verify a token and return its record, or throw if it is invalid.
 */
export const verifyToken = async (token: string, type: TokenType): Promise<Token> => {
  const payload = jwt.verify(token, config.jwt.secret) as TokenPayload;
  const tokenDoc = await prisma.token.findFirst({
    where: { token, type, userId: payload.id, blacklisted: false },
  });
  if (!tokenDoc) {
    throw new Error('Token not found');
  }
  return tokenDoc;
};

/**
 * Generate access and refresh auth tokens for a user.
 */
export const generateAuthTokens = async (user: User): Promise<AuthTokens> => {
  const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
  const accessToken = generateToken(user.id, accessTokenExpires, tokenTypes.ACCESS);

  const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
  const refreshToken = generateToken(user.id, refreshTokenExpires, tokenTypes.REFRESH);
  await saveToken(refreshToken, user.id, refreshTokenExpires, tokenTypes.REFRESH);

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate(),
    },
  };
};

export default {
  generateToken,
  saveToken,
  verifyToken,
  generateAuthTokens,
};
