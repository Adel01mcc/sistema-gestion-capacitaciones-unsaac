import { Router } from 'express';
import { asyncRoute, HttpError, idParam } from '../errors.js';
import { requireAuth, requirePermission } from '../security.js';
import { createUserServices } from '../composition.js';

export function createUserRouter(db, services = createUserServices(db)) {
  const { users, roles } = services;
  const router = Router();
  router.use(requireAuth);
  router.get('/users', (req, res, next) => {
    const hasUsers = req.user.permissions.includes('users.manage');
    const hasPeople = req.user.permissions.includes('people.manage');
    if (!hasUsers && !(hasPeople && ['instructor', 'participante'].includes(req.query.role))) return next(new HttpError(403, 'No tiene permiso para consultar usuarios.'));
    const result = users.list(req.query);
    // El selector de instructores no necesita datos personales ni permisos ajenos.
    if (!hasUsers) result.data = result.data.map(({ id, first_name, last_name, active, specialty }) => ({ id, first_name, last_name, active, specialty }));
    res.json(result);
  });
  router.get('/instructors', requirePermission('users.manage', 'people.manage'), (req, res) => {
    const result = users.list(req.query, 'instructor');
    if (!req.user.permissions.includes('users.manage')) result.data = result.data.map(({ id, first_name, last_name, active, specialty }) => ({ id, first_name, last_name, active, specialty }));
    res.json(result);
  });
  router.get('/users/:id', requirePermission('users.manage'), (req, res) => res.json({ data: users.get(idParam(req.params.id)) }));
  router.post('/users', requirePermission('users.manage'), asyncRoute(async (req, res) => res.status(201).json({ data: await users.create(req.body, req.user.id) })));
  router.put('/users/:id', requirePermission('users.manage'), asyncRoute(async (req, res) => res.json({ data: await users.update(idParam(req.params.id), req.body, req.user.id) })));
  router.put('/users/:id/roles', requirePermission('roles.manage'), (req, res) => res.json({ data: users.assignRoles(idParam(req.params.id), req.body, req.user.id) }));
  router.get('/roles', requirePermission('users.manage', 'roles.manage'), (_req, res) => res.json({ data: roles.list() }));
  router.get('/permissions', requirePermission('users.manage', 'roles.manage'), (_req, res) => res.json({ data: roles.permissions() }));
  router.put('/roles/:id', requirePermission('roles.manage'), (req, res) => res.json({ data: roles.update(idParam(req.params.id), req.body, req.user.id) }));
  return router;
}
