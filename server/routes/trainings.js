import { Router } from 'express';
import { idParam } from '../errors.js';
import { requireAuth, requirePermission } from '../security.js';
import { createTraining, dashboard, getTraining, listTrainings, updateTraining } from '../services/training-service.js';

export function createTrainingRouter(db) {
  const router = Router();
  router.use(requireAuth);
  router.get('/dashboard', (req, res) => res.json({ data: dashboard(db, req.user) }));
  router.get('/trainings', (req, res) => res.json(listTrainings(db, req.query, req.user)));
  router.get('/trainings/:id', (req, res) => res.json({ data: getTraining(db, idParam(req.params.id), req.user) }));
  router.post('/trainings', requirePermission('trainings.manage'), (req, res) => res.status(201).json({ data: createTraining(db, req.body, req.user) }));
  router.put('/trainings/:id', requirePermission('trainings.manage'), (req, res) => res.json({ data: updateTraining(db, idParam(req.params.id), req.body, req.user) }));
  return router;
}
