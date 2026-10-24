import * as repository from '../repositories/vehicle-repository.js';
import { HttpError } from '../utils/http-error.js';
import {
  listQuery,
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
    await repository.deleteVehicle(vehicleId(id));
  } catch (error) {
    missing(error);
  }
}
