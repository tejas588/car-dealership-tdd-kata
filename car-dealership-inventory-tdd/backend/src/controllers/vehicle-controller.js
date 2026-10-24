import * as service from '../services/vehicle-service.js';

export async function create(request, response) {
  response.status(201).json(await service.create(request.body));
}
export async function list(request, response) {
  response.json(await service.list(request.query, false));
}
export async function search(request, response) {
  response.json(await service.list(request.query, true));
}
export async function update(request, response) {
  response.json(await service.update(request.params.id, request.body));
}
export async function remove(request, response) {
  await service.remove(request.params.id);
  response.status(204).send();
}
