import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { apiLimiter } from './middleware/rate-limit.js';
import authRouter from './routes/auth.js';
import tasksRouter from './routes/tasks.js';
import clientsRouter from './routes/clients.js';
import billingRouter from './routes/billing.js';
import dashboardRouter from './routes/dashboard.js';
import reportsRouter from './routes/reports.js';
import portalRouter from './routes/portal.js';
import usersRouter from './routes/users.js';
import taskTypesRouter from './routes/task-types.js';
import { authenticate } from './middleware/auth.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api', apiLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/tasks', authenticate, tasksRouter);
app.use('/api/clients', authenticate, clientsRouter);
app.use('/api/billing', authenticate, billingRouter);
app.use('/api/dashboard', authenticate, dashboardRouter);
app.use('/api/reports', authenticate, reportsRouter);
app.use('/api/portal', authenticate, portalRouter);
app.use('/api/users', authenticate, usersRouter);
app.use('/api/task-types', authenticate, taskTypesRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`LegalSpot API corriendo en puerto ${PORT}`);
});

export default app;
