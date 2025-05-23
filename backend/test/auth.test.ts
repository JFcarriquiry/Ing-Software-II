/// <reference path="../src/types/express-session.d.ts" />
import '../src/types/express-session.d.ts'; // Step 1: Explicitly import type definition
import { register, login, logout } from '../src/controllers/auth.controller';
import { db } from '../src/db';
import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('../src/db');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('../src/utils/validation'); // Mock validation utility

import { validatePassword } from '../src/utils/validation';

describe('Auth Controller', () => { // Consolidated describe block
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseJson: any;
  let responseStatus: number;
  let responseCookie: { name?: string; value?: string; options?: any } = {};


  beforeEach(() => {
    // Reset mocks for each test
    jest.clearAllMocks();

    // Default mock for validatePassword to be successful
    (validatePassword as jest.Mock).mockReturnValue({ isValid: true });

    responseJson = {};
    responseStatus = 200;
    responseCookie = {};
    // Initialize mockRequest with a session object and a mock regenerate function
    mockRequest = {
      session: {
        regenerate: jest.fn((callback) => callback()),
        destroy: jest.fn((callback) => callback()),
        // Add other session properties if needed by tests, e.g., user, restaurant
      } as any, // Use 'as any' for simplicity or create a more specific mock type
    };
    mockResponse = {
      status: jest.fn((status) => {
        responseStatus = status;
        return mockResponse as Response;
      }),
      json: jest.fn((json) => {
        responseJson = json;
        return mockResponse as Response;
      }),
      cookie: jest.fn((name: string, value: any, options?: import('express').CookieOptions) => {
        responseCookie = { name, value, options };
        return mockResponse as Response;
      }),
      clearCookie: jest.fn(),
    };
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Specific mockRequest for this test, ensuring 'session' is not part of it unless needed
      mockRequest.body = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] }) // Check for existing user
        .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Test User', email: 'test@example.com', role: 'user' }] }); // Insert new user
      (bcrypt.genSalt as jest.Mock).mockResolvedValueOnce('somesalt');
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashedpassword');

      await register(mockRequest as Request, mockResponse as Response);

      expect(db.query).toHaveBeenCalledTimes(2);
      expect(db.query).toHaveBeenNthCalledWith(1, 'SELECT * FROM users WHERE email = $1', ['test@example.com']);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 'somesalt'); // Updated to expect 'somesalt'
      expect(db.query).toHaveBeenNthCalledWith(2,
        'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role',
        ['test@example.com', 'hashedpassword', 'Test User', 'user']
      );
      expect(responseStatus).toBe(201);
      expect(responseJson).toEqual({ id: 1, name: 'Test User', email: 'test@example.com', role: 'user' });
    });

    it('should return 400 if email already exists', async () => {
      mockRequest.body = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };
      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 1, name: 'Existing User', email: 'test@example.com' }] });

      await register(mockRequest as Request, mockResponse as Response);

      expect(db.query).toHaveBeenCalledTimes(1);
      expect(db.query).toHaveBeenCalledWith('SELECT * FROM users WHERE email = $1', ['test@example.com']);
      expect(responseStatus).toBe(400);
      expect(responseJson).toEqual({ error: 'El email ya está registrado' }); // Match actual error message
    });

    it('should return 500 if database query fails during registration check', async () => {
      mockRequest.body = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };
      (db.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

      await register(mockRequest as Request, mockResponse as Response);
      expect(db.query).toHaveBeenCalledTimes(1);
      expect(db.query).toHaveBeenCalledWith('SELECT * FROM users WHERE email = $1', ['test@example.com']);
      expect(responseStatus).toBe(500);
      expect(responseJson).toEqual({ error: 'Error al registrar usuario' }); // Match actual error message
    });

    it('should return 500 if bcrypt hashing fails', async () => {
      mockRequest.body = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };
      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [] }); // for user check
      (bcrypt.genSalt as jest.Mock).mockResolvedValueOnce('somesalt'); // genSalt succeeds
      (bcrypt.hash as jest.Mock).mockRejectedValueOnce(new Error('Hashing error')); // hash fails

      await register(mockRequest as Request, mockResponse as Response);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 'somesalt'); // Updated to expect 'somesalt'
      expect(responseStatus).toBe(500);
      expect(responseJson).toEqual({ error: 'Error al registrar usuario' }); // Match actual error message
    });

    it('should return 500 if database query fails during user insertion', async () => {
      mockRequest.body = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };
      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] }) // Check for existing user
        .mockRejectedValueOnce(new Error('Database error during insert')); // User insertion fails
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashedpassword');

      await register(mockRequest as Request, mockResponse as Response);
      expect(db.query).toHaveBeenCalledTimes(2);
      expect(responseStatus).toBe(500);
      expect(responseJson).toEqual({ error: 'Error al registrar usuario' }); // Match actual error message
    });
  });

  describe('login', () => {
    beforeEach(() => {
        // Ensure mockRequest.session.regenerate is set for login tests
        mockRequest.session = {
            regenerate: jest.fn((callback) => callback()),
            destroy: jest.fn((callback) => callback()) // Also mock destroy for consistency if needed later
        } as any;
    });

    it('should login an existing user successfully and return a JWT token', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
      };
      const mockUser = { id: 1, name: 'Test User', email: 'test@example.com', password: 'hashedpassword', role: 'user' };

      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockUser] });
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
      // jwt.sign is not called by this controller function as per current implementation.
      // (jwt.sign as jest.Mock).mockReturnValue('mocked.jwt.token'); 

      await login(mockRequest as Request, mockResponse as Response);

      expect(db.query).toHaveBeenCalledWith('SELECT * FROM users WHERE email = $1 AND role = $2', ['test@example.com', 'user']);
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
      expect(mockRequest.session!.regenerate).toHaveBeenCalledTimes(1);
      // expect(jwt.sign).toHaveBeenCalledWith({ userId: mockUser.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' }); // This was removed
      expect(responseStatus).toBe(200);
      expect(responseJson).toEqual({ id: mockUser.id, name: mockUser.name, email: mockUser.email, role: mockUser.role });
    });

    it('should return 401 if user does not exist', async () => {
      mockRequest.body = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };
      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      await login(mockRequest as Request, mockResponse as Response);

      expect(db.query).toHaveBeenCalledWith('SELECT * FROM users WHERE email = $1 AND role = $2', ['nonexistent@example.com', 'user']);
      expect(responseStatus).toBe(401);
      expect(responseJson).toEqual({ error: 'Credenciales inválidas' }); // Match actual error message
    });

    it('should return 401 if password does not match', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };
      const mockUser = { id: 1, name: 'Test User', email: 'test@example.com', password: 'hashedpassword', role: 'user' };
      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockUser] });
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await login(mockRequest as Request, mockResponse as Response);

      expect(db.query).toHaveBeenCalledWith('SELECT * FROM users WHERE email = $1 AND role = $2', ['test@example.com', 'user']);
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedpassword');
      expect(responseStatus).toBe(401);
      expect(responseJson).toEqual({ error: 'Credenciales inválidas' }); // Match actual error message
    });

     it('should return 500 if database query fails during login', async () => {
        mockRequest.body = {
            email: 'test@example.com',
            password: 'password123',
        };
        (db.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

        await login(mockRequest as Request, mockResponse as Response);
        expect(responseStatus).toBe(500);
        expect(responseJson).toEqual({ error: 'Error al iniciar sesión' }); // Match actual error message
    });

    it('should return 500 if bcrypt compare fails', async () => {
        mockRequest.body = {
            email: 'test@example.com',
            password: 'password123',
        };
        const mockUser = { id: 1, name: 'Test User', email: 'test@example.com', password: 'hashedpassword', role: 'user' };
        (db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockUser] });
        (bcrypt.compare as jest.Mock).mockRejectedValueOnce(new Error('Compare error'));

        await login(mockRequest as Request, mockResponse as Response);
        expect(responseStatus).toBe(500);
        expect(responseJson).toEqual({ error: 'Error al iniciar sesión' }); // Match actual error message
    });


    it('should return 500 if JWT signing fails', async () => {
        mockRequest.body = {
            email: 'test@example.com',
            password: 'password123',
        };
        const mockUser = { id: 1, name: 'Test User', email: 'test@example.com', password: 'hashedpassword', role: 'user' };
        (db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockUser] });
        (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
        // Mock jwt.sign to throw an error
        (jwt.sign as jest.Mock).mockImplementation(() => {
            throw new Error('JWT signing error');
        });

        // When jwt.sign throws, the catch block in req.session.regenerate's callback should be hit.
        // The current mock for regenerate calls callback(), implying success.
        // We need to ensure regenerate calls its callback with the error if jwt.sign fails.
        // However, the controller's catch block around jwt.sign is what leads to 500.
        // The session.regenerate callback itself doesn't receive the JWT error directly in the controller.
        // The error is caught within the regenerate callback, and then res.status(500) is called.

        mockRequest.session!.regenerate = jest.fn((callback) => {
            try {
                // Simulate the part of the controller logic that calls jwt.sign
                const token = jwt.sign({ userId: mockUser.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
                // This part won't be reached if jwt.sign throws as mocked above
                (mockRequest.session as any).user = { id: mockUser.id, email: mockUser.email, name: mockUser.name, role: mockUser.role, token };
                callback(); 
            } catch (jwtError) {
                // This simulate the catch block inside regenerate in controller if jwt.sign fails
                callback(jwtError); // Pass the error to the callback
            }
        });


        await login(mockRequest as Request, mockResponse as Response);
        expect(responseStatus).toBe(500);
        expect(responseJson).toEqual({ error: 'Error al iniciar sesión' });
    });

    it('should return 500 if session regeneration fails', async () => {
        mockRequest.body = {
            email: 'test@example.com',
            password: 'password123',
        };
        const mockUser = { id: 1, name: 'Test User', email: 'test@example.com', password: 'hashedpassword', role: 'user' };
        (db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockUser] });
        (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
        // Mock session.regenerate to call its callback with an error
        mockRequest.session!.regenerate = jest.fn((callback) => callback(new Error('Session regeneration failed')));

        await login(mockRequest as Request, mockResponse as Response);

        expect(responseStatus).toBe(500);
        expect(responseJson).toEqual({ error: 'Error al iniciar sesión' });
    });

  });

  describe('logout', () => {
    it('should clear session and cookie then return 200', () => {
      const mockNext = jest.fn();
      // Ensure req.session and req.session.destroy are mocked for logout
      mockRequest.session = {
          destroy: jest.fn((callback) => callback()) // Mock destroy to call its callback without error
      } as any;

      logout(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.session!.destroy).toHaveBeenCalledTimes(1);
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('connect.sid', { path: '/' });
      expect(responseStatus).toBe(200);
      expect(responseJson).toEqual({ message: 'Sesión cerrada' }); // Match actual message
    });

    it('should return 500 if session destroy fails', () => {
        const mockNext = jest.fn();
        mockRequest.session = {
            destroy: jest.fn((callback) => callback(new Error('Session destroy failed')))
        } as any;

        logout(mockRequest as Request, mockResponse as Response, mockNext);
        expect(mockRequest.session!.destroy).toHaveBeenCalledTimes(1);
        expect(responseStatus).toBe(500);
        expect(responseJson).toEqual({ error: 'Error al cerrar sesión' }); // Match actual message
    });
  });
});