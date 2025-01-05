import session from 'express-session';
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export const sessionStore = new MemoryStore({
  checkPeriod: 86400000, // prune expired entries every 24h
  max: 1000, // maximum number of sessions to store
  ttl: 86400000, // time to live in milliseconds (24h)
});

export const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'default_secret',
  resave: false,
  saveUninitialized: true,
  store: sessionStore,
  cookie: {
    secure: false,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
});