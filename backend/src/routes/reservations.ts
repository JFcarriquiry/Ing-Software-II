import { Router } from 'express';
import { createReservation, getReservations, deleteReservation, confirmPresence } from '../controllers/reservations.controller';
import { ensureAuthenticated } from '../utils/auth';

const router = Router();
router.post('/', ensureAuthenticated, createReservation);
router.get('/', ensureAuthenticated, getReservations);
router.delete('/:id', ensureAuthenticated, deleteReservation);
// Confirmar presencia de reserva
router.patch('/:id/confirm-presence', ensureAuthenticated, confirmPresence);

export default router;
