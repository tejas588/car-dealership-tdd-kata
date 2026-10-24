import prisma from '../config/prisma.js';

export function findUserByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}

export function findUserById(id) {
  return prisma.user.findUnique({ where: { id } });
}

export function createUser(data) {
  return prisma.user.create({ data });
}
