import { Request, Response, NextFunction } from 'express';
import db from '../db/connection';

export const auditLogger = (req: Request, res: Response, next: NextFunction) => {
  // Only log mutating HTTP operations
  const mutatingMethods = ['POST', 'PATCH', 'PUT', 'DELETE'];
  if (!mutatingMethods.includes(req.method)) {
    return next();
  }

  res.on('finish', () => {
    // Log successful mutations (HTTP 2xx)
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        const actor = req.user ? `${req.user.name} (${req.user.role})` : 'Anonymous / System';
        const action = `${req.method} ${req.baseUrl}${req.path}`;
        const target = req.originalUrl;
        const severity =
          req.path.includes('policies') || req.path.includes('settings') ? 'warning' : 'info';

        let ipAddress =
          (req.headers['x-forwarded-for'] as string) ||
          req.ip ||
          req.socket.remoteAddress ||
          '127.0.0.1';
        if (ipAddress === '::1') ipAddress = '127.0.0.1';

        db.prepare(
          `INSERT INTO audit_logs (actor, action, target, severity, ip_address, created_at)
           VALUES (?, ?, ?, ?, ?, DATETIME('now'))`
        ).run(actor, action, target, severity, ipAddress);
      } catch (err) {
        console.error('[AuditLogger] Failed to write audit log:', err);
      }
    }
  });

  next();
};
