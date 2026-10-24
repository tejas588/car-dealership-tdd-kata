import { loginUser, registerUser } from '../services/auth-service.js';

export async function register(request, response) {
  const user = await registerUser(request.body);
  response.status(201).json({ user });
}

export async function login(request, response) {
  const result = await loginUser(request.body);
  response.status(200).json(result);
}
