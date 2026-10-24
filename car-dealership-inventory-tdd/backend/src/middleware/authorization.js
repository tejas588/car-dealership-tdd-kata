import jwt from 'jsonwebtoken';
import { findUserById } from '../repositories/user-repository.js';
import { HttpError } from '../utils/http-error.js';

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function requireAuth(request, _response, next) {
  const match = /^Bearer (\S+)$/.exec(request.headers.authorization || '');
  if (!match || !process.env.JWT_SECRET) {
    return next(
      new HttpError(401, 'UNAUTHENTICATED', 'Authentication required'),
    );
  }

  try {
    const claims = jwt.verify(match[1], process.env.JWT_SECRET, {
      algorithms: ['HS256'],
    });
    if (typeof claims !== 'object' || !uuidPattern.test(claims.sub || '')) {
      throw new Error('Invalid subject');
    }
    const user = await findUserById(claims.sub);
    if (!user) throw new Error('User no longer exists');
    request.user = { id: user.id, role: user.role };
    next();
  } catch {
    next(new HttpError(401, 'UNAUTHENTICATED', 'Authentication required'));
  }
}

export function requireRole(role) {
  return (request, _response, next) => {
    if (request.user?.role !== role) {
      return next(new HttpError(403, 'FORBIDDEN', 'Insufficient permission'));
    }
    next();
  };
}
