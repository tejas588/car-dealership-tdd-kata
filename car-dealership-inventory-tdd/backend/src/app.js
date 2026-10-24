import express from 'express';
import authRouter from './routes/auth.js';
import healthRouter from './routes/health.js';
import { errorHandler } from './middleware/error-handler.js';

const app = express();
app.use(express.json());
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use(errorHandler);

export default app;
