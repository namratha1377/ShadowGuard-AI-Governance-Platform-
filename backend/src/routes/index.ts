import { Router } from 'express';
import authRouter from './auth.routes';
import dashboardRouter from './dashboard.routes';
import interactionsRouter from './interactions.routes';
import riskRouter from './risk.routes';
import dataSecurityRouter from './data-security.routes';
import policiesRouter from './policies.routes';
import auditRouter from './audit.routes';
import settingsRouter from './settings.routes';
import harnessTracesRouter from './harnessTraces.routes';
import chatbotRouter from './chatbot.routes';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/ai-interactions', interactionsRouter);
apiRouter.use('/risk-assessments', riskRouter);
apiRouter.use('/data-security', dataSecurityRouter);
apiRouter.use('/policies', policiesRouter);
apiRouter.use('/audit-logs', auditRouter);
apiRouter.use('/settings', settingsRouter);
apiRouter.use('/harness-traces', harnessTracesRouter);
apiRouter.use('/chatbot', chatbotRouter);

export default apiRouter;
