
import express from 'express';
import cors from 'cors';

import authRouter from './routes/auth.js';
import healthRouter from './routes/health.js';
import vehicleRouter from './routes/vehicles.js';
import { errorHandler } from './middleware/error-handler.js';

const app = express();

// Allow frontend to communicate with backend
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'https://car-dealership-tdd-kata.vercel.app',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/vehicles', vehicleRouter);

app.use(errorHandler);

export default app;
