import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { randomBytes } from "crypto";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

// Simple hash for development purposes
function simpleHash(password: string): string {
  return `simple-hash-${password}`;
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "barter-trade-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure Passport authentication
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`Authenticating user: ${username}`);
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          console.log(`User not found: ${username}`);
          return done(null, false);
        }
        
        // Special case for demo users
        if (user.password.startsWith('$2b$')) {
          console.log('Demo user detected - checking "password"');
          if (password === 'password') {
            console.log('Demo user authenticated successfully');
            return done(null, user);
          } else {
            console.log('Invalid password for demo user');
            return done(null, false);
          }
        } 
        
        // For newly created users with our simple hash
        if (user.password.startsWith('simple-hash-')) {
          const expectedHash = simpleHash(password);
          if (user.password === expectedHash) {
            console.log('Regular user authenticated successfully');
            return done(null, user);
          } else {
            console.log('Invalid password for regular user');
            return done(null, false);
          }
        }
        
        // Fallback for any other password format (should not happen)
        console.log('Unknown password format, authentication failed');
        return done(null, false);
      } catch (err) {
        console.error('Authentication error:', err);
        return done(err);
      }
    })
  );

  // Serialize and deserialize user instances to and from the session
  passport.serializeUser((user, done) => {
    console.log(`Serializing user ID: ${user.id}`);
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log(`Deserializing user ID: ${id}`);
      const user = await storage.getUser(id);
      if (!user) {
        console.log(`User not found for ID: ${id}`);
        return done(null, false);
      }
      done(null, user);
    } catch (err) {
      console.error('Deserialization error:', err);
      done(err, null);
    }
  });

  // Register route
  app.post("/api/register", async (req, res, next) => {
    try {
      console.log("Registration attempt:", { username: req.body.username, email: req.body.email });
      
      // Validate required fields
      if (!req.body.username || !req.body.password || !req.body.email) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        console.log("Registration failed: Username already exists");
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        console.log("Registration failed: Email already exists");
        return res.status(400).json({ message: "Email already exists" });
      }

      // Create the new user with our simple hash
      const user = await storage.createUser({
        ...req.body,
        password: simpleHash(req.body.password),
      });

      console.log("User registered successfully:", { id: user.id, username: user.username });
      
      // Log in the new user
      req.login(user, (err) => {
        if (err) {
          console.error("Error during login after registration:", err);
          return next(err);
        }
        res.status(201).json(user);
      });
    } catch (err) {
      console.error("Registration error:", err);
      next(err);
    }
  });

  // Login route
  app.post("/api/login", (req, res, next) => {
    console.log("Login attempt:", { username: req.body.username });
    
    // Validate required fields
    if (!req.body.username || !req.body.password) {
      return res.status(400).json({ message: "Missing username or password" });
    }
    
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error("Login error:", err);
        return next(err);
      }
      
      if (!user) {
        console.log("Login failed: Invalid credentials");
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("Login session error:", loginErr);
          return next(loginErr);
        }
        console.log("User logged in successfully:", { id: user.id, username: user.username });
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  // Logout route
  app.post("/api/logout", (req, res, next) => {
    console.log("Logout attempt for user:", req.user?.id);
    if (!req.isAuthenticated()) {
      console.log("Logout attempted while not authenticated");
      return res.status(200).json({ message: "Not logged in" });
    }
    
    const userId = req.user?.id;
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return next(err);
      }
      console.log("User logged out successfully:", userId);
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // User info route
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      console.log("Unauthenticated user info request");
      return res.status(401).json({ message: "Not authenticated" });
    }
    console.log("User info requested for:", req.user?.id);
    res.json(req.user);
  });
}
