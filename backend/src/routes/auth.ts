import { Router } from 'express';
import passport from 'passport';

const router = Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    // Redirect to frontend after successful login
    res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173');
  }
);

// Endpoint para obtener el usuario autenticado
router.get('/me', (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    const { id, email, role } = req.user;
    res.json({ id, email, role });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

export default router;
