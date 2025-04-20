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

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Shared with socket handlers
import { registerOccupancySocket } from './sockets/occupancySocket';
registerOccupancySocket(io);

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

// session middleware for passport (in-memory for dev)
app.use(session({ secret: process.env.JWT_SECRET || 'dev', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

app.use('/api/restaurants', restaurantsRouter);
app.use('/api/reservations', reservationsRouter);
app.use('/api/auth', authRouter);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`API + WS running on ${PORT}`));
