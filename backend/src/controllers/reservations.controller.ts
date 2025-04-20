import { Request, Response } from 'express';
import { db } from '../db';
import { io } from '../sockets/occupancySocket';
import { sendMail } from '../utils/mailer';

export const createReservation = async (req: Request, res: Response) => {
  const user = req.user as { id: number; email: string } | undefined;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { restaurant_id, reservation_at, guests } = req.body;
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const { rows: r1 } = await client.query(
      'SELECT seats_free, name FROM restaurants WHERE id=$1 FOR UPDATE',
      [restaurant_id]
    );
    const restaurantName = r1[0].name;
    if (!r1.length) return res.status(404).json({ error: 'Restaurant not found' });
    if (r1[0].seats_free < guests) return res.status(400).json({ error: 'Not enough seats' });

    await client.query(
      'INSERT INTO reservations (user_id, restaurant_id, reservation_at, guests) VALUES ($1,$2,$3,$4)',
      [user.id, restaurant_id, reservation_at, guests]
    );
    await client.query(
      'UPDATE restaurants SET seats_free = seats_free - $1 WHERE id=$2',
      [guests, restaurant_id]
    );
    await client.query('COMMIT');
    try {
      await sendMail(
        user.email,
        'Reserva Confirmada',
        `Tu reserva en ${restaurantName} para ${guests} personas el ${reservation_at} ha sido confirmada.`
      );
    } catch (mailErr) {
      console.error('Mail error', mailErr);
    }

    // Emit socket event
    io.to(`restaurant_${restaurant_id}`).emit('occupancy_update', { restaurant_id });

    res.status(201).json({ message: 'Reservation confirmed' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};

export const getReservations = async (req: Request, res: Response) => {
  const user = req.user as { id: number } | undefined;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const { rows } = await db.query(
      `SELECT r.id, r.restaurant_id, rest.name AS restaurant_name, r.reservation_at, r.guests
       FROM reservations r
       JOIN restaurants rest ON rest.id = r.restaurant_id
       WHERE r.user_id = $1`,
      [user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteReservation = async (req: Request, res: Response) => {
  const user = req.user as { id: number; email: string } | undefined;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const id = Number(req.params.id);
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'SELECT r.restaurant_id, r.guests, r.reservation_at, rest.name AS restaurant_name FROM reservations r JOIN restaurants rest ON rest.id = r.restaurant_id WHERE r.id = $1 AND r.user_id = $2 FOR UPDATE',
      [id, user.id]
    );
    if (!rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Reservation not found' });
    }
    const { restaurant_id, guests, reservation_at, restaurant_name } = rows[0];
    await client.query('DELETE FROM reservations WHERE id = $1', [id]);
    await client.query(
      'UPDATE restaurants SET seats_free = seats_free + $1 WHERE id = $2',
      [guests, restaurant_id]
    );
    await client.query('COMMIT');
    try {
      await sendMail(
        user.email,
        'Reserva Cancelada',
        `Tu reserva en ${restaurant_name} para ${guests} personas el ${reservation_at} ha sido cancelada.`
      );
    } catch (mailErr) {
      console.error('Mail error', mailErr);
    }
    io.to(`restaurant_${restaurant_id}`).emit('occupancy_update', { restaurant_id });
    res.json({ message: 'Reservation cancelled' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};
