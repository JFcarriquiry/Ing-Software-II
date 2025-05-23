import 'express-session';

interface UserSession {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface RestaurantSession extends UserSession {
  restaurant_id: number;
}

declare module 'express-session' {
  interface SessionData {
    user?: UserSession;
    restaurant?: RestaurantSession;
  }
}