import { Router } from 'express';
import { ensureAuthenticated } from '../utils/auth';
import { getAll, getById, getAvailability, getRestaurantReservations, confirmPresence } from '../controllers/restaurants.controller';

const router = Router();

// Public routes
router.get('/', getAll);

// Protected routes for restaurant management
router.get('/reservations', ensureAuthenticated, getRestaurantReservations);
router.patch('/reservations/:id/confirm-presence', ensureAuthenticated, confirmPresence);

// Public routes for restaurant details
router.get('/:id', getById);
router.get('/:id/availability', getAvailability);

export default router;
