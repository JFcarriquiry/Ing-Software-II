import { Router } from 'express';
import { ensureAuthenticated } from '../utils/auth';
import { getAll, getById, getAvailability, getRestaurantReservations } from '../controllers/restaurants.controller';

const router = Router();
router.get('/', getAll);
router.get('/:id', getById);
// Disponibilidad por intervalos de 15 minutos
router.get('/:id/availability', getAvailability);
// Reservas del restaurante (para confirmación)
router.get('/:id/reservations', ensureAuthenticated, getRestaurantReservations);

export default router;
