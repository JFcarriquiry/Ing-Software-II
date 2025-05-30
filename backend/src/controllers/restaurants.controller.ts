import { Request, Response } from 'express';
import { db } from '../db';
import { io } from '../sockets/occupancySocket';

export const getAll = async (req: Request, res: Response) => {
  const { tag } = req.query;

  let query = `
    SELECT r.id, r.name, r.latitude, r.longitude, r.description, r.seats_total, (r.seats_total/2)::int AS tables_total,
      COALESCE(
        json_agg(t.name) FILTER (WHERE t.name IS NOT NULL), 
        '[]'
      ) AS tags
    FROM restaurants r
    LEFT JOIN restaurant_tags rt ON r.id = rt.restaurant_id
    LEFT JOIN tags t ON rt.tag_id = t.id
  `;
  const params: any[] = [];

  if (tag) {
    query += ` WHERE t.name = $1`;
    params.push(tag);
  }

  query += ` GROUP BY r.id`;

  const { rows } = await db.query(query, params);
  res.json(rows);
};

export const getById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { rows } = await db.query(
    'SELECT id, name, latitude, longitude, description, phone, email, address, seats_total, (seats_total/2)::int AS tables_total FROM restaurants WHERE id = $1',
    [id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Restaurant not found' });
  res.json(rows[0]);
};

const TZ_OFFSET_MS = 3 * 60 * 60 * 1000;
// Obtiene disponibilidad por intervalos de 15 minutos para un día dado
export const getAvailability = async (req: Request, res: Response) => {
  const restaurant_id = Number(req.params.id);
  const date = req.query.date as string;
  if (!date) return res.status(400).json({ error: 'Date query parameter is required' });
  // Parse date and compute local midnight
  const [y, m, d] = date.split('-').map(Number);
  // const base = Date.UTC(y, m - 1, d, 0, 0, 0); // UTC midnight for the selected day. No longer directly used for slot start.

  const TZ_OFFSET_MS = 3 * 60 * 60 * 1000; // Uruguay is UTC-3, so UTC = local + 3h. This offset is added to local time components to get UTC.

  // ---- genera intervalos 10:00 → 23:30 (cada 15'
  const openMin = 10 * 60; // Local 10:00 AM in minutes from midnight
  const lastResMin = 23 * 60 + 30; // Local 11:30 PM in minutes from midnight
  const intervals: { start: number; end: number }[] = [];
  const slotDurationMs = 15 * 60 * 1000; // Duration of each availability slot (15 minutes)

  for (let mins = openMin; mins <= lastResMin; mins += 15) {
    // Calculate UTC timestamp for the start of the local time slot
    // mins is local minutes from midnight.
    // Date.UTC(y,m-1,d, localHour, localMinute,0) gives UTC timestamp for that local time if it were UTC.
    // Adding TZ_OFFSET_MS converts this local time representation to the actual UTC timestamp.
    // e.g., for 10:00 local (UTC-3), this calculates Date.UTC(y,m-1,d,10,0,0) and adds 3 hours.
    const slotStartUtc = Date.UTC(y, m - 1, d, Math.floor(mins / 60), mins % 60, 0) + TZ_OFFSET_MS;
    const slotEndUtc = slotStartUtc + slotDurationMs; // End of the 15-minute slot in UTC
    intervals.push({ start: slotStartUtc, end: slotEndUtc });
  }
  // Fetch seats_total
  const { rows: restRows } = await db.query('SELECT seats_total FROM restaurants WHERE id=$1', [restaurant_id]);
  if (!restRows.length) return res.status(404).json({ error: 'Restaurant not found' });
  const tables_total = Math.floor(restRows[0].seats_total / 2);
  // Ventana local del día (UTC-3)
  const dateStart = new Date(y, m-1, d, 0, 0, 0);          // UTC
  const dateEnd   = new Date(y, m-1, d, 23, 59, 59);       // UTC
  const { rows: resRows } = await db.query(
    `SELECT reservation_at, guests FROM reservations
     WHERE restaurant_id=$1
       AND status IN ('pending','confirmed')
       AND reservation_at + INTERVAL '90 minutes' > $2
       AND reservation_at < $3`,
    [restaurant_id, dateStart, dateEnd]
  );
  // Compute availability
  const availability = intervals.map(({ start: slotStartUtc, end: slotEndUtc }) => {
    const usedTables = resRows.reduce((sum: number, r:any) => {
        const rStartUtc = new Date(r.reservation_at).getTime();
        const rEndUtc   = rStartUtc + 90 * 60_000; // Reservation lasts 90 minutes
        // Check for overlap: reservation [rStartUtc, rEndUtc) vs slot [slotStartUtc, slotEndUtc)
        // A slot is occupied if the reservation period overlaps with the slot period.
        if (rStartUtc < slotEndUtc && rEndUtc > slotStartUtc) {
          return sum + Math.ceil(r.guests / 2);
        }
        return sum;
    }, 0);
    return { start: slotStartUtc, available_tables: tables_total - usedTables };
  });
  res.json(availability);
};

// Obtiene todas las reservas de un restaurante (para confirmación)
export const getRestaurantReservations = async (req: any, res: Response) => {
  const restaurantSession = req.session.restaurant;
  if (!restaurantSession || !restaurantSession.restaurant_id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { rows } = await db.query(
      `SELECT r.*, u.name as user_name, u.email as user_email
       FROM reservations r
       JOIN users u ON r.user_id = u.id
       WHERE r.restaurant_id = $1
       ORDER BY r.reservation_at DESC`,
      [restaurantSession.restaurant_id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching restaurant reservations:', error);
    res.status(500).json({ error: 'Error al obtener las reservas' });
  }
};

export const confirmPresence = async (req: Request, res: Response) => {
  const restaurantSession = req.session.restaurant;
  if (!restaurantSession || !restaurantSession.restaurant_id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const reservationId = Number(req.params.id);
  const { present } = req.body; // esperamos un boolean: true para asistió, false para no asistió

  if (typeof present !== 'boolean') {
    return res.status(400).json({ error: 'El cuerpo de la solicitud debe incluir un campo "present" booleano.' });
  }

  try {
    // Verify the reservation belongs to this restaurant
    const { rows } = await db.query(
      'SELECT * FROM reservations WHERE id = $1 AND restaurant_id = $2',
      [reservationId, restaurantSession.restaurant_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    const newStatus = present ? 'confirmed' : 'no-show';
    // Update the reservation
    await db.query(
      `UPDATE reservations 
       SET presence_confirmed = $1, 
           presence_confirmed_at = CASE WHEN $1 = true THEN NOW() ELSE NULL END,
           status = $2
       WHERE id = $3`,
      [present, newStatus, reservationId]
    );

    // Emit socket event for real-time updates
    io.to(`restaurant_${restaurantSession.restaurant_id}`).emit('reservation_updated', {
      reservation_id: reservationId,
      presence_confirmed: present,
      status: newStatus
    });

    res.json({ message: present ? 'Presencia confirmada' : 'Ausencia confirmada' });
  } catch (error) {
    console.error('Error confirming presence/absence:', error);
    res.status(500).json({ error: 'Error al confirmar presencia/ausencia' });
  }
};


