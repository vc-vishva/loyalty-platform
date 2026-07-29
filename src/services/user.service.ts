import httpStatus from 'http-status';
import bcrypt from 'bcryptjs';
import { Prisma, Role, User } from '@prisma/client';
import prisma from '../config/prisma.js';
import ApiError from '../utils/ApiError.js';

export interface CreateUserBody {
  name: string;
  email: string;
  password: string;
  role?: Role;
}

const SALT_ROUNDS = 8;

/**
 * Create a user (password is hashed before persisting).
 */
export const createUser = async (userBody: CreateUserBody): Promise<User> => {
  if (await getUserByEmail(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  const hashedPassword = await bcrypt.hash(userBody.password, SALT_ROUNDS);
  const data: Prisma.UserCreateInput = {
    name: userBody.name,
    email: userBody.email,
    password: hashedPassword,
    ...(userBody.role ? { role: userBody.role } : {}),
  };
  return prisma.user.create({ data });
};

/**
 * Get user by email.
 */
export const getUserByEmail = async (email: string): Promise<User | null> => {
  return prisma.user.findUnique({ where: { email } });
};

/**
 * Get user by id.
 */
export const getUserById = async (id: string): Promise<User | null> => {
  return prisma.user.findUnique({ where: { id } });
};

/**
 * Check whether a plaintext password matches the user's stored hash.
 */
export const isPasswordMatch = async (password: string, user: User): Promise<boolean> => {
  return bcrypt.compare(password, user.password);
};

export default {
  createUser,
  getUserByEmail,
  getUserById,
  isPasswordMatch,
};
