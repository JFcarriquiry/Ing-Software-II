import { Request, Response } from 'express';
import { db } from '../db';

export const getAll = async (_: Request, res: Response) => {
  const { rows } = await db.query(
    'SELECT id, name, latitude, longitude, description, seats_free, seats_total FROM restaurants'
  );
  res.json(rows);
};

export const getById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { rows } = await db.query(
    'SELECT id, name, latitude, longitude, description, phone, email, address, seats_free, seats_total FROM restaurants WHERE id = $1',
    [id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Restaurant not found' });
  res.json(rows[0]);
};
