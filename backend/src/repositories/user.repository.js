import { prisma } from '../config/prisma.js';

export function findUserByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}

export function findUserByPhone(phone) {
  return prisma.user.findUnique({ where: { phone } });
}

export function findUserByIdentifier(identifier) {
  return prisma.user.findFirst({
    where: { OR: [{ email: identifier }, { phone: identifier }] },
  });
}

export function findSafeUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
}

export function createUser(data) {
  return prisma.user.create({
    data,
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
}
