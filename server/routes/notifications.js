import { Router } from 'express';
import { idParam } from '../errors.js';
import { requireAuth, requirePermission } from '../security.js';

export function createNotificationRouter({ service, events }) {
  const router = Router();
  router.use(requireAuth);
  router.get('/notifications', (req, res) => res.json(service.list(req.user.id, req.query)));
  router.patch('/notifications/:id/read', (req, res) => res.json({ data: service.markRead(idParam(req.params.id), req.user.id) }));
  router.post('/notifications/retry', requirePermission('trainings.manage'), (_req, res) => res.json({ data: events.retryPending() }));
  return router;
}
