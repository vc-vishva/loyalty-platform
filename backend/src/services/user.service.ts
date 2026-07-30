import httpStatus from 'http-status';
import bcrypt from 'bcryptjs';
import { Prisma, User } from '@prisma/client';
import prisma from '../config/prisma.js';
import ApiError from '../utils/ApiError.js';
import { errorMessages } from '../config/messages.js';
import { CreateUserInput } from '../types/user.type.js';

const SALT_ROUNDS = 8;

/**
 * Create a user (password is hashed before persisting). Email is unique across
 * the system.
 */
export const createUser = async (userBody: CreateUserInput): Promise<User> => {
  if (await getUserByEmail(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, errorMessages.EMAIL_TAKEN);
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

/** Get a user by email. */
export const getUserByEmail = async (email: string): Promise<User | null> => {
  return prisma.user.findUnique({ where: { email } });
};

/** Check whether a plaintext password matches the user's stored hash. */
export const isPasswordMatch = async (password: string, user: User): Promise<boolean> => {
  return bcrypt.compare(password, user.password);
};

export default {
  createUser,
  getUserByEmail,
  isPasswordMatch,
};
