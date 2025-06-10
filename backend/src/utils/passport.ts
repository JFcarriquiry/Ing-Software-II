import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as LocalStrategy } from 'passport-local';
import { db } from '../db';
import dotenv from 'dotenv';
dotenv.config();

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID as string,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken: string, refreshToken: string, profile: any, done: (err: any, user?: any) => void) => {
  // upsert user
  const email = profile.emails?.[0].value;
  const google_id = profile.id;
  const { rows } = await db.query(
    'INSERT INTO users (google_id, email) VALUES ($1,$2) ON CONFLICT (google_id) DO UPDATE SET email = EXCLUDED.email RETURNING *',
    [google_id, email]
  );
  return done(null, rows[0]);
}));

passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
    const { rows } = await db.query('SELECT * FROM users WHERE email = $1 AND password = $2', [email, password]);
    const user = rows[0];
    if (!user) return done(null, false, { message: 'Credenciales inválidas' });
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user: any, done: (err: any, id?: any) => void) => done(null, user.id));
passport.deserializeUser(async (id: number, done: (err: any, user?: any) => void) => {
  const { rows } = await db.query('SELECT * FROM users WHERE id=$1', [id]);
  done(null, rows[0]);
});
