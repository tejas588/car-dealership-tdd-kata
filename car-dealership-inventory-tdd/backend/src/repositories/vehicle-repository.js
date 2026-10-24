import prisma from '../config/prisma.js';

export const createVehicle = (data) => prisma.vehicle.create({ data });
export const updateVehicle = (id, data) =>
  prisma.vehicle.update({ where: { id }, data });
export const deleteVehicle = (id) => prisma.vehicle.delete({ where: { id } });
export const listVehicles = (where, page, limit) =>
  prisma.vehicle.findMany({
    where,
    orderBy: { id: 'asc' },
    skip: (page - 1) * limit,
    take: limit,
  });
export const countVehicles = (where) => prisma.vehicle.count({ where });
