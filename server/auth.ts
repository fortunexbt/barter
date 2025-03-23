import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  // Check if stored password has the correct format (hash.salt)
  if (!stored || !stored.includes(".")) {
    console.error("Invalid stored password format for comparison");
    return false;
  }
  
  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) {
    console.error("Invalid stored password components");
    return false;
  }
  
  try {
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Password comparison error:", error);
    return false;
  }
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

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Quick admin login for testing
        if (username === "admin" && password === "admin123") {
          // Create an admin user object for the quick login
          const adminUser = {
            id: 9999, // Special ID for quick admin login
            username: "admin",
            password: "admin_hash", // Not actually used for verification
            fullName: "Admin User",
            email: "admin@example.com",
            role: "admin",
            kycStatus: "verified",
            accountLevel: "premium",
            tradingSince: new Date(),
            profileImage: "https://randomuser.me/api/portraits/men/99.jpg",
            identityCommitment: null,
            zkpIdentity: null,
            zkpVerified: true
          };
          return done(null, adminUser);
        }
        
        // Regular user authentication
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

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

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      console.log("User registered successfully:", { id: user.id, username: user.username });
      
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

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      console.log("Unauthenticated user info request");
      return res.status(401).json({ message: "Not authenticated" });
    }
    console.log("User info requested for:", req.user?.id);
    res.json(req.user);
  });
}
