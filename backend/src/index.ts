import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { Server } from 'socket.io';
import passport from 'passport';
import session from 'express-session';
import './utils/passport';  // Passport configuration
import restaurantsRouter from './routes/restaurants';
import reservationsRouter from './routes/reservations';
import authRouter from './routes/auth';
import { db } from './db';
import { sendMail } from './utils/mailer';
import { registerOccupancySocket, io } from './sockets/occupancySocket';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const ioServer = new Server(httpServer, {
  cors: { origin: '*' }
});

// Shared with socket handlers
registerOccupancySocket(ioServer);

// DB migration: añade columna requested_guests si no existe y la popula en las filas existentes
(async () => {
  await db.query("ALTER TABLE reservations ADD COLUMN IF NOT EXISTS requested_guests INT CHECK (requested_guests > 0)");
  await db.query("UPDATE reservations SET requested_guests = guests WHERE requested_guests IS NULL");
})().catch(err => console.error("Migration error", err));

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

// session middleware for passport (in-memory for dev)
app.use(session({ secret: process.env.JWT_SECRET || 'dev', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

app.use('/api/restaurants', restaurantsRouter);
app.use('/api/reservations', reservationsRouter);
app.use('/api/auth', authRouter);

// Job para marcar no_show a reservas pendientes no confirmadas 15 min después
async function checkNoShows() {
  const { rows } = await db.query(
    `SELECT id, user_id, restaurant_id FROM reservations
     WHERE status = 'pending' AND reservation_at + INTERVAL '15 minutes' < NOW()`
  );
  for (const r of rows) {
    await db.query("UPDATE reservations SET status='no_show' WHERE id=$1", [r.id]);
    // notificar al usuario
    const { rows: u } = await db.query('SELECT email FROM users WHERE id=$1', [r.user_id]);
    if (u[0]?.email) {
      await sendMail(
        u[0].email,
        'Reserva Cancelada por No Show',
        'Tu reserva ha sido cancelada automáticamente por no presentarte.'
      );
    }
    ioServer.to(`restaurant_${r.restaurant_id}`).emit('occupancy_update', { restaurant_id: r.restaurant_id });
  }
}
// Ejecutar cada minuto
setInterval(checkNoShows, 60000);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`API + WS running on ${PORT}`));
