import * as repository from '../repositories/vehicle-repository.js';
import { HttpError } from '../utils/http-error.js';
import {
  listQuery,
  restockInput,
  vehicleId,
  vehicleInput,
} from '../utils/vehicle-validation.js';

const output = (vehicle) => ({
  id: vehicle.id,
  make: vehicle.make,
  model: vehicle.model,
  category: vehicle.category,
  price: vehicle.price.toFixed(2),
  quantityInStock: vehicle.quantity,
});

function missing(error) {
  if (error.code === 'P2025')
    throw new HttpError(404, 'VEHICLE_NOT_FOUND', 'Vehicle not found');
  if (error.code === 'P2003')
    throw new HttpError(409, 'VEHICLE_HAS_PURCHASES', 'Vehicle has purchases');
  throw error;
}

export async function create(body) {
  return output(await repository.createVehicle(vehicleInput(body)));
}

export async function list(query, search) {
  const { where, page, limit } = listQuery(query, search);
  const [data, total] = await Promise.all([
    repository.listVehicles(where, page, limit),
    repository.countVehicles(where),
  ]);
  return { data: data.map(output), pagination: { page, limit, total } };
}

export async function update(id, body) {
  const data = vehicleInput(body);
  try {
    return output(await repository.updateVehicle(vehicleId(id), data));
  } catch (error) {
    missing(error);
  }
}

export async function remove(id) {
  try {
    const validId = vehicleId(id);
    if (await repository.countPurchases(validId))
      throw new HttpError(
        409,
        'VEHICLE_HAS_PURCHASES',
        'Vehicle has purchases',
      );
    await repository.deleteVehicle(validId);
  } catch (error) {
    missing(error);
  }
}

export async function purchase(id, userId) {
  const result = await repository.purchaseOne(vehicleId(id), userId);
  if (!result.vehicle)
    throw new HttpError(404, 'VEHICLE_NOT_FOUND', 'Vehicle not found');
  if (!result.purchased)
    throw new HttpError(409, 'OUT_OF_STOCK', 'Vehicle is out of stock');
  return output(result.vehicle);
}

export async function restock(id, body) {
  const result = await repository.restockVehicle(
    vehicleId(id),
    restockInput(body),
  );
  if (!result.vehicle)
    throw new HttpError(404, 'VEHICLE_NOT_FOUND', 'Vehicle not found');
  if (!result.restocked)
    throw new HttpError(400, 'VALIDATION_ERROR', 'Stock limit exceeded');
  return output(result.vehicle);
}
