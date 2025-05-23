// backend/src/routes/auth.ts
import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { register, login, restaurantLogin, getMe, logout } from '../controllers/auth.controller';

// Define session types
declare module 'express-session' {
  interface SessionData {
    user?: {
      id: number;
      email: string;
      name: string;
      role: string;
    };
    restaurant?: {
      id: number;
      email: string;
      name: string;
      role: string;
      restaurant_id: number;
    };
  }
}

const router = Router();

// Local authentication routes
router.post('/register', register);
router.post('/login', login);

// Restaurant authentication route
router.post('/restaurant/login', restaurantLogin);

// Get current user
router.get('/me', getMe);

// Logout route
router.post('/logout', logout);

// Google OAuth routes
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req: Request, res: Response) => {
    // Set session data for OAuth users to maintain consistency with local auth
    if (req.user) {
      const user = req.user as any;
      req.session.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || 'user'
      };
    }
    // Redirect to frontend after successful login
    res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173');
  }
);

export default router;
