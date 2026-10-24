import { Router } from 'express';
import * as controller from '../controllers/vehicle-controller.js';
import { requireAuth, requireRole } from '../middleware/authorization.js';

const router = Router();
router.use(requireAuth);
router.get('/', controller.list);
router.get('/search', controller.search);
router.post('/', requireRole('ADMIN'), controller.create);
router.put('/:id', requireRole('ADMIN'), controller.update);
router.delete('/:id', requireRole('ADMIN'), controller.remove);
export default router;
