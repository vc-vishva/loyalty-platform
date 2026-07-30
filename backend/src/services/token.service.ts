import jwt from 'jsonwebtoken';
import moment from 'moment';
import { Role, User } from '@prisma/client';
import config from '../config/config.js';
import { tokenTypes, TokenType } from '../config/tokens.js';

export interface TokenPayload {
  id: string;
  businessId: string;
  role: Role;
  iat: number;
  exp: number;
  type: TokenType;
}

/**
 * Generate a stateless access JWT for a user. The payload embeds `businessId`
 * and `role`, which every protected request uses for tenant scoping.
 */
export const generateAccessToken = (user: User): string => {
  const expires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
  const payload = {
    id: user.id,
    businessId: user.businessId,
    role: user.role,
    iat: moment().unix(),
    exp: expires.unix(),
    type: tokenTypes.ACCESS,
  };
  return jwt.sign(payload, config.jwt.secret);
};

export default {
  generateAccessToken,
};
