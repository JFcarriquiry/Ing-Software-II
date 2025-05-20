import 'express-serve-static-core';
import { Session } from 'express-session';

declare module 'express-serve-static-core' {
  interface Request {
    // Passport adds this method at runtime
    isAuthenticated(): boolean;
    logout(callback: (err: any) => void): void;
    // Optional user property
    user?: any;
  }
}

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
