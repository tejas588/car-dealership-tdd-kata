import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
  createUser,
  findUserByEmail,
} from '../repositories/user-repository.js';
import { HttpError } from '../utils/http-error.js';
import { validateLogin, validateRegistration } from '../utils/validate-auth.js';

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export async function registerUser(body) {
  const input = validateRegistration(body);
  const passwordHash = await bcrypt.hash(input.password, 12);
  try {
    const user = await createUser({
      name: input.name,
      email: input.email,
      passwordHash,
    });
    return publicUser(user);
  } catch (error) {
    if (error.code === 'P2002') {
      throw new HttpError(
        409,
        'EMAIL_ALREADY_EXISTS',
        'Email already registered',
      );
    }
    throw error;
  }
}

export async function loginUser(body) {
  const input = validateLogin(body);
  const user = await findUserByEmail(input.email);
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new HttpError(
      401,
      'INVALID_CREDENTIALS',
      'Invalid email or password',
    );
  }
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required');
  }
  const token = jwt.sign({}, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '1h',
    subject: user.id,
  });
  return { token, user: publicUser(user) };
}
