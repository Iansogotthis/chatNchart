import session from 'express-session';
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export const sessionStore = new MemoryStore({
  checkPeriod: 86400000, // prune expired entries every 24h
  max: 1000, // maximum number of sessions to store
  ttl: 86400000, // time to live in milliseconds (24h)
});

export const sessionMiddleware = session({
  secret: process.env.REPL_ID || "porygon-supremacy",
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  }
});
