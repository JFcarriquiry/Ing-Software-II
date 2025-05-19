import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { validatePassword } from '../utils/validation';

export const register = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  console.log('Registration attempt:', { email, name });

  try {
    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ error: passwordValidation.error });
    }

    // Check if user already exists
    const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const result = await db.query(
      'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role',
      [email, hashedPassword, name, 'user']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error in register:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  console.log('Login attempt:', { email });

  try {
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1 AND role = $2',
      [email, 'user']
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    req.session.regenerate((err) => {
      if (err) {
        console.error('Error regenerating session during login:', err);
        return res.status(500).json({ error: 'Error al iniciar sesión' });
      }

      req.session.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      };

      console.log('Session after login:', req.session);

      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      });
    });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

export const restaurantLogin = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  console.log('Restaurant login attempt:', { email });

  try {
    // First, check if a restaurant user with this email exists
    const userResult = await db.query(
      'SELECT * FROM users WHERE email = $1 AND role = $2',
      [email, 'restaurant']
    );

    console.log('Found restaurant user:', userResult.rows.length > 0);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = userResult.rows[0];
    
    // Try bcrypt verification first
    console.log('Checking password for user:', { id: user.id, email: user.email });
    let isValidPassword = false;
    
    try {
      // Try to verify with bcrypt
      isValidPassword = await bcrypt.compare(password, user.password);
    } catch (error) {
      console.log('Bcrypt comparison failed, trying plain text comparison');
      // If bcrypt verification fails, try plain text comparison for development
      isValidPassword = (password === user.password);
    }
    
    console.log('Password valid:', isValidPassword);

    if (!isValidPassword) {
      // Try one more time with direct comparison as a fallback for development
      if (password === user.password) {
        console.log('Plain text password match as fallback');
        isValidPassword = true;
      } else {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }
    }

    // Get the restaurant information
    const restaurantResult = await db.query(
      'SELECT * FROM restaurants WHERE id = $1',
      [user.restaurant_id]
    );

    console.log('Found restaurant:', restaurantResult.rows.length > 0);

    if (restaurantResult.rows.length === 0) {
      return res.status(404).json({ error: 'Restaurante no encontrado' });
    }

    const restaurant = restaurantResult.rows[0];

    req.session.regenerate((err) => {
      if (err) {
        console.error('Error regenerating session during restaurant login:', err);
        return res.status(500).json({ error: 'Error al iniciar sesión' });
      }
      req.session.restaurant = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        restaurant_id: user.restaurant_id
      };

      console.log('Session after restaurant login:', req.session);

      // Return user data
      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        restaurant_id: user.restaurant_id
      });
    });
  } catch (error) {
    console.error('Error in restaurant login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

export const logout = (req: Request, res: Response, next: NextFunction) => {
  console.log('logout called, session:', req.session);
  
  // Check if we're using express-session
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Error al cerrar sesión' });
      }
      res.clearCookie('connect.sid', { path: '/' });
      return res.status(200).json({ message: 'Sesión cerrada' });
    });
  } 
  // If we're using passport
  else if (req.logout) {
    req.logout((err) => {
      if (err) return next(err);
      // Destruye la sesión en el servidor
      req.session?.destroy((sessionErr) => {
        // Limpia la cookie de sesión en el cliente
        res.clearCookie('connect.sid', { path: '/' });
        // Envía respuesta al frontend
        return sessionErr ? res.sendStatus(500) : res.sendStatus(200);
      });
    });
  } 
  else {
    res.status(200).json({ message: 'No session to close' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  console.log('getMe called, session:', req.session);
  
  if (req.session.user) {
    return res.json(req.session.user);
  }
  
  if (req.session.restaurant) {
    return res.json(req.session.restaurant);
  }
  
  if (req.isAuthenticated && req.isAuthenticated()) {
    const user = req.user as any;
    return res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      ...(user.restaurant_id ? { restaurant_id: user.restaurant_id } : {})
    });
  }
  
  res.status(401).json({ error: 'No autenticado' });
}; 