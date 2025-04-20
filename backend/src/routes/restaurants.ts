import { Router } from 'express';
import { getAll, getById } from '../controllers/restaurants.controller';

const router = Router();
router.get('/', getAll);
router.get('/:id', getById);

export default router;
