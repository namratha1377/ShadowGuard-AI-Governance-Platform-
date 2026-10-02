import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes';
import { requestLogger } from './middleware/logger.middleware';
import { auditLogger } from './middleware/auditLogger';
import { errorHandler } from './middleware/error.middleware';
import { db } from './db';
import { initSocket } from './socket';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS for frontend at http://localhost:5173
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);

app.use(express.json());
app.use(requestLogger);
app.use(auditLogger);

// Health check endpoint
app.get('/', (_req, res) => {
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number })
    .count;
  const interactionCount = (
    db.prepare('SELECT COUNT(*) as count FROM ai_interactions').get() as { count: number }
  ).count;

  res.json({
    message: 'Hello ShadowGuard',
    service: 'backend',
    status: 'online',
    stats: {
      users: userCount,
      aiInteractions: interactionCount,
    },
  });
});

// Mount API routes
app.use('/api', apiRouter);

// Centralized error handling middleware
app.use(errorHandler);

const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`[Backend] ShadowGuard Express + Socket.IO API running on port ${PORT}`);
});

