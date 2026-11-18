import { Router } from 'express';
import { asyncRoute, HttpError, idParam } from '../errors.js';
import { requireAuth, requirePermission } from '../security.js';
import { assignRoles, createUser, getUser, listRoles, listUsers, updateRole, updateUser } from '../services/user-service.js';

export function createUserRouter(db) {
  const router = Router();
  router.use(requireAuth);
  router.get('/users', (req, res, next) => {
    const hasUsers = req.user.permissions.includes('users.manage');
    const hasPeople = req.user.permissions.includes('people.manage');
    if (!hasUsers && !(hasPeople && ['instructor', 'participante'].includes(req.query.role))) return next(new HttpError(403, 'No tiene permiso para consultar usuarios.'));
    const result = listUsers(db, req.query);
    // El selector de instructores no necesita datos personales ni permisos ajenos.
    if (!hasUsers) result.data = result.data.map(({ id, first_name, last_name, active, specialty }) => ({ id, first_name, last_name, active, specialty }));
    res.json(result);
  });
  router.get('/instructors', requirePermission('users.manage', 'people.manage'), (req, res) => {
    const result = listUsers(db, req.query, 'instructor');
    if (!req.user.permissions.includes('users.manage')) result.data = result.data.map(({ id, first_name, last_name, active, specialty }) => ({ id, first_name, last_name, active, specialty }));
    res.json(result);
  });
  router.get('/users/:id', requirePermission('users.manage'), (req, res) => res.json({ data: getUser(db, idParam(req.params.id)) }));
  router.post('/users', requirePermission('users.manage'), asyncRoute(async (req, res) => res.status(201).json({ data: await createUser(db, req.body, req.user.id) })));
  router.put('/users/:id', requirePermission('users.manage'), asyncRoute(async (req, res) => res.json({ data: await updateUser(db, idParam(req.params.id), req.body, req.user.id) })));
  router.put('/users/:id/roles', requirePermission('roles.manage'), (req, res) => res.json({ data: assignRoles(db, idParam(req.params.id), req.body, req.user.id) }));
  router.get('/roles', requirePermission('users.manage', 'roles.manage'), (_req, res) => res.json({ data: listRoles(db) }));
  router.get('/permissions', requirePermission('users.manage', 'roles.manage'), (_req, res) => res.json({ data: db.prepare('SELECT * FROM permissions ORDER BY code').all() }));
  router.put('/roles/:id', requirePermission('roles.manage'), (req, res) => res.json({ data: updateRole(db, idParam(req.params.id), req.body, req.user.id) }));
  return router;
}
