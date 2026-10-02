import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './middleware/auth';
import { AuthUser } from './types/auth.types';

let io: Server | null = null;

export interface InteractionStatusUpdate {
  interaction_id: number;
  response?: string | null;
  status?: 'allowed' | 'restricted' | 'blocked' | 'pending_review' | 'analyzing' | 'rejected';
  decision?: string;
  risk_score?: number;
  risk_tier?: string;
  explanation?: string;
  timestamp?: string;
  suggested_decision?: string;
  review_note?: string;
  requires_human_review?: boolean;
  matched_policy?: string | null;
}

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.IO] New client connected: ${socket.id}`);

    // Client must emit 'identify' with their JWT
    socket.on('identify', (payload: { token?: string } | string) => {
      try {
        const token = typeof payload === 'string' ? payload : payload?.token;
        if (!token) {
          socket.emit('identify-error', { error: 'No token provided' });
          return;
        }

        const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
        const room = decoded.role === 'admin' ? 'admin-room' : `user-${decoded.id}`;

        // Join designated room
        socket.join(room);
        (socket as any).user = decoded;
        (socket as any).room = room;

        console.log(`[Socket.IO] Socket ${socket.id} identified as ${decoded.role} (${decoded.name || decoded.email}). Joined room: ${room}`);

        socket.emit('identified', {
          success: true,
          room,
          role: decoded.role,
          userId: decoded.id,
          name: decoded.name,
        });
      } catch (err: any) {
        console.warn(`[Socket.IO] Identification failed for socket ${socket.id}:`, err.message);
        socket.emit('identify-error', { error: 'Invalid or expired token' });
      }
    });

    // Bidirectional testing hook for verification
    socket.on('test-ping', (data: any) => {
      console.log(`[Socket.IO] test-ping received from ${socket.id}:`, data);
      socket.emit('test-pong', {
        status: 'ok',
        echo: data,
        serverTime: new Date().toISOString(),
      });
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
}

export function getIO(): Server | null {
  return io;
}

/**
 * Broadcasts a new interaction event to the admin room.
 * (Actual automatic triggering wired in Phase 24 alongside real-time pipeline)
 */
export function emitNewInteraction(interaction: any): boolean {
  if (!io) {
    console.warn('[Socket.IO] Cannot emit new-interaction: socket server not initialized');
    return false;
  }
  console.log('[Socket.IO] Emitting "new-interaction" to admin-room:', interaction?.id);
  io.to('admin-room').emit('new-interaction', interaction);
  return true;
}

/**
 * Emits an interaction status update to a specific user's room (user-<userId>).
 * (Actual automatic triggering wired in Phase 24 alongside real-time pipeline)
 */
export function emitInteractionStatusUpdate(
  userId: number | string,
  update: InteractionStatusUpdate
): boolean {
  if (!io) {
    console.warn('[Socket.IO] Cannot emit interaction-status-update: socket server not initialized');
    return false;
  }
  const room = `user-${userId}`;
  console.log(`[Socket.IO] Emitting "interaction-status-update" to ${room}:`, update);
  io.to(room).emit('interaction-status-update', update);
  return true;
}
