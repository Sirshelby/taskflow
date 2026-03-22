import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerSchema, loginSchema, createTaskSchema, updateTaskSchema } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import bcrypt from "bcryptjs";

const MemoryStore = createMemoryStore(session);

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Session setup
  app.use(
    session({
      secret: "taskflow-secret-key-2026",
      resave: false,
      saveUninitialized: false,
      store: new MemoryStore({ checkPeriod: 86400000 }),
      cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        httpOnly: true,
        sameSite: "lax",
      },
    })
  );

  // ── Auth Routes ──

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const data = registerSchema.parse(req.body);
      const existing = storage.getUserByEmail(data.email);
      if (existing) {
        return res.status(409).json({ message: "Email already in use" });
      }
      const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = storage.createUser({
        email: data.email,
        password: hashedPassword,
        name: data.name,
      });
      req.session.userId = user.id;
      return res.json({ id: user.id, email: user.email, name: user.name });
    } catch (err: any) {
      if (err.errors) {
        return res.status(400).json({ message: err.errors[0]?.message || "Validation error" });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const data = loginSchema.parse(req.body);
      const user = storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      const valid = await bcrypt.compare(data.password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      req.session.userId = user.id;
      return res.json({ id: user.id, email: user.email, name: user.name });
    } catch (err: any) {
      if (err.errors) {
        return res.status(400).json({ message: err.errors[0]?.message || "Validation error" });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    return res.json({ id: user.id, email: user.email, name: user.name });
  });

  // ── Task Routes ──

  app.get("/api/tasks", requireAuth, (req: Request, res: Response) => {
    const tasks = storage.getTasksByUser(req.session.userId!);
    return res.json(tasks);
  });

  app.post("/api/tasks", requireAuth, (req: Request, res: Response) => {
    try {
      const data = createTaskSchema.parse(req.body);
      const task = storage.createTask({
        ...data,
        userId: req.session.userId!,
        createdAt: new Date().toISOString(),
        description: data.description ?? null,
        dueDate: data.dueDate ?? null,
      });
      return res.status(201).json(task);
    } catch (err: any) {
      if (err.errors) {
        return res.status(400).json({ message: err.errors[0]?.message || "Validation error" });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/tasks/:id", requireAuth, (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const data = updateTaskSchema.parse(req.body);
      const task = storage.updateTask(id, req.session.userId!, data);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      return res.json(task);
    } catch (err: any) {
      if (err.errors) {
        return res.status(400).json({ message: err.errors[0]?.message || "Validation error" });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/tasks/:id", requireAuth, (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const deleted = storage.deleteTask(id, req.session.userId!);
    if (!deleted) {
      return res.status(404).json({ message: "Task not found" });
    }
    return res.json({ message: "Deleted" });
  });

  return httpServer;
}
