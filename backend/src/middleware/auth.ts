import { Request, Response, NextFunction } from 'express';

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

export const ensureAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.user || req.session.restaurant) {
    return next();
  }
  res.status(401).json({ error: 'No autenticado' });
};

export const ensureUser = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.user && req.session.user.role === 'user') {
    return next();
  }
  res.status(403).json({ error: 'Acceso denegado' });
};

export const ensureRestaurant = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.restaurant && req.session.restaurant.role === 'restaurant') {
    return next();
  }
  res.status(403).json({ error: 'Acceso denegado' });
}; 