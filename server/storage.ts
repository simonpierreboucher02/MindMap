import { users, maps, nodes, connections, type User, type InsertUser, type Map, type InsertMap, type Node, type InsertNode, type Connection, type InsertConnection, type MapWithNodes } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser & { recoveryKey: string }): Promise<User>;
  
  getMaps(userId: string): Promise<Map[]>;
  getMap(id: string, userId: string): Promise<MapWithNodes | undefined>;
  createMap(map: InsertMap & { userId: string }): Promise<Map>;
  updateMap(id: string, userId: string, updates: Partial<InsertMap>): Promise<Map | undefined>;
  deleteMap(id: string, userId: string): Promise<boolean>;
  
  getNodes(mapId: string): Promise<Node[]>;
  createNode(node: InsertNode): Promise<Node>;
  updateNode(id: string, updates: Partial<InsertNode>): Promise<Node | undefined>;
  deleteNode(id: string): Promise<boolean>;
  
  getConnections(mapId: string): Promise<Connection[]>;
  createConnection(connection: InsertConnection): Promise<Connection>;
  deleteConnection(id: string): Promise<boolean>;
  
  searchMaps(userId: string, query: string): Promise<Map[]>;
  
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser & { recoveryKey: string }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getMaps(userId: string): Promise<Map[]> {
    return await db
      .select()
      .from(maps)
      .where(eq(maps.userId, userId))
      .orderBy(desc(maps.updatedAt));
  }

  async getMap(id: string, userId: string): Promise<MapWithNodes | undefined> {
    const [map] = await db
      .select()
      .from(maps)
      .where(and(eq(maps.id, id), eq(maps.userId, userId)));
    
    if (!map) return undefined;

    const mapNodes = await db
      .select()
      .from(nodes)
      .where(eq(nodes.mapId, id));

    const mapConnections = await db
      .select()
      .from(connections)
      .where(eq(connections.mapId, id));

    return {
      ...map,
      nodes: mapNodes,
      connections: mapConnections,
    };
  }

  async createMap(insertMap: InsertMap & { userId: string }): Promise<Map> {
    const [map] = await db
      .insert(maps)
      .values(insertMap)
      .returning();
    return map;
  }

  async updateMap(id: string, userId: string, updates: Partial<InsertMap>): Promise<Map | undefined> {
    const [map] = await db
      .update(maps)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(maps.id, id), eq(maps.userId, userId)))
      .returning();
    return map || undefined;
  }

  async deleteMap(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(maps)
      .where(and(eq(maps.id, id), eq(maps.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getNodes(mapId: string): Promise<Node[]> {
    return await db
      .select()
      .from(nodes)
      .where(eq(nodes.mapId, mapId));
  }

  async createNode(node: InsertNode): Promise<Node> {
    const [newNode] = await db
      .insert(nodes)
      .values(node)
      .returning();
    return newNode;
  }

  async updateNode(id: string, updates: Partial<InsertNode>): Promise<Node | undefined> {
    const [node] = await db
      .update(nodes)
      .set(updates)
      .where(eq(nodes.id, id))
      .returning();
    return node || undefined;
  }

  async deleteNode(id: string): Promise<boolean> {
    const result = await db
      .delete(nodes)
      .where(eq(nodes.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getConnections(mapId: string): Promise<Connection[]> {
    return await db
      .select()
      .from(connections)
      .where(eq(connections.mapId, mapId));
  }

  async createConnection(connection: InsertConnection): Promise<Connection> {
    const [newConnection] = await db
      .insert(connections)
      .values(connection)
      .returning();
    return newConnection;
  }

  async deleteConnection(id: string): Promise<boolean> {
    const result = await db
      .delete(connections)
      .where(eq(connections.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async searchMaps(userId: string, query: string): Promise<Map[]> {
    return await db
      .select()
      .from(maps)
      .where(and(
        eq(maps.userId, userId),
        sql`${maps.title} ILIKE ${`%${query}%`}`
      ))
      .orderBy(desc(maps.updatedAt));
  }
}

export const storage = new DatabaseStorage();
