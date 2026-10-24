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
export const countPurchases = (vehicleId) =>
  prisma.purchase.count({ where: { vehicleId } });

export function purchaseOne(id, userId) {
  return prisma.$transaction(async (tx) => {
    const changed = await tx.vehicle.updateMany({
      where: { id, quantity: { gt: 0 } },
      data: { quantity: { decrement: 1 } },
    });
    const vehicle = await tx.vehicle.findUnique({ where: { id } });
    if (!changed.count) return { vehicle, purchased: false };
    await tx.purchase.create({
      data: { vehicleId: id, userId, unitPrice: vehicle.price },
    });
    return { vehicle, purchased: true };
  });
}

export async function restockVehicle(id, quantity) {
  const changed = await prisma.vehicle.updateMany({
    where: { id, quantity: { lte: 2147483647 - quantity } },
    data: { quantity: { increment: quantity } },
  });
  return {
    vehicle: await prisma.vehicle.findUnique({ where: { id } }),
    restocked: Boolean(changed.count),
  };
}
