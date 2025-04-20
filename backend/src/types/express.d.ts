import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Request {
    // Passport adds this method at runtime
    isAuthenticated(): boolean;
    // Optional user property
    user?: any;
  }
}
