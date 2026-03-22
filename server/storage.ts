import {
  type User,
  type InsertUser,
  type Task,
  type InsertTask,
  users,
  tasks,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, and, desc } from "drizzle-orm";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite);

export interface IStorage {
  getUser(id: number): User | undefined;
  getUserByEmail(email: string): User | undefined;
  createUser(user: InsertUser): User;
  getTasksByUser(userId: number): Task[];
  getTask(id: number, userId: number): Task | undefined;
  createTask(task: InsertTask): Task;
  updateTask(id: number, userId: number, data: Partial<InsertTask>): Task | undefined;
  deleteTask(id: number, userId: number): boolean;
}

export class DatabaseStorage implements IStorage {
  getUser(id: number): User | undefined {
    return db.select().from(users).where(eq(users.id, id)).get();
  }

  getUserByEmail(email: string): User | undefined {
    return db.select().from(users).where(eq(users.email, email)).get();
  }

  createUser(insertUser: InsertUser): User {
    return db.insert(users).values(insertUser).returning().get();
  }

  getTasksByUser(userId: number): Task[] {
    return db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(desc(tasks.createdAt))
      .all();
  }

  getTask(id: number, userId: number): Task | undefined {
    return db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .get();
  }

  createTask(task: InsertTask): Task {
    return db.insert(tasks).values(task).returning().get();
  }

  updateTask(id: number, userId: number, data: Partial<InsertTask>): Task | undefined {
    const existing = this.getTask(id, userId);
    if (!existing) return undefined;
    return db
      .update(tasks)
      .set(data)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning()
      .get();
  }

  deleteTask(id: number, userId: number): boolean {
    const existing = this.getTask(id, userId);
    if (!existing) return false;
    db.delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .run();
    return true;
  }
}

export const storage = new DatabaseStorage();
