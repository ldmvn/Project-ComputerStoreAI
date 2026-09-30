import bcrypt from 'bcryptjs';
import { createUser, findSafeUserById, findUserByEmail, findUserByIdentifier, findUserByPhone } from '../repositories/user.repository.js';
import { createAccessToken } from './token.service.js';

export class AuthConflictError extends Error {
  constructor(field, message) {
    super(message);
    this.name = 'AuthConflictError';
    this.statusCode = 409;
    this.field = field;
  }
}

export async function registerUser({ fullName, email, phone, password }) {
  if (await findUserByEmail(email)) throw new AuthConflictError('email', 'Email này đã được sử dụng.');
  if (await findUserByPhone(phone)) throw new AuthConflictError('phone', 'Số điện thoại này đã được sử dụng.');

  const passwordHash = await bcrypt.hash(password, 12);
  try {
    return await createUser({ fullName, email, phone, passwordHash, role: 'USER' });
  } catch (error) {
    if (error?.code === 'P2002') {
      const target = Array.isArray(error.meta?.target) ? error.meta.target.join(',') : String(error.meta?.target || '');
      if (target.includes('email')) throw new AuthConflictError('email', 'Email này đã được sử dụng.');
      if (target.includes('phone')) throw new AuthConflictError('phone', 'Số điện thoại này đã được sử dụng.');
    }
    throw error;
  }
}

export class AuthCredentialsError extends Error {
  constructor() {
    super('Email/số điện thoại hoặc mật khẩu không chính xác.');
    this.name = 'AuthCredentialsError';
    this.statusCode = 401;
  }
}

export class AuthAccountDisabledError extends Error {
  constructor() {
    super('Tài khoản hiện đang bị khóa.');
    this.name = 'AuthAccountDisabledError';
    this.statusCode = 403;
  }
}

export async function loginUser({ identifier, password }) {
  const user = await findUserByIdentifier(identifier);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new AuthCredentialsError();
  if (!user.isActive) throw new AuthAccountDisabledError();

  const safeUser = await findSafeUserById(user.id);
  return { token: createAccessToken(user), user: safeUser };
}

export async function getCurrentUser(userId) {
  const user = await findSafeUserById(userId);
  if (!user || !user.isActive) throw new AuthCredentialsError();
  return user;
}
