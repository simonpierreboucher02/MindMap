import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer, real } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  recoveryKey: text("recovery_key").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const maps = pgTable("maps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const nodes = pgTable("nodes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mapId: varchar("map_id").notNull().references(() => maps.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  x: real("x").notNull(),
  y: real("y").notNull(),
  width: integer("width").notNull().default(120),
  height: integer("height").notNull().default(60),
  shape: text("shape").notNull().default("rectangle"), // "rectangle", "circle", "hexagon"
  color: text("color").notNull().default("#3b82f6"),
  textColor: text("text_color").notNull().default("#ffffff"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const connections = pgTable("connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mapId: varchar("map_id").notNull().references(() => maps.id, { onDelete: "cascade" }),
  sourceNodeId: varchar("source_node_id").notNull().references(() => nodes.id, { onDelete: "cascade" }),
  targetNodeId: varchar("target_node_id").notNull().references(() => nodes.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const userRelations = relations(users, ({ many }) => ({
  maps: many(maps),
}));

export const mapRelations = relations(maps, ({ one, many }) => ({
  user: one(users, {
    fields: [maps.userId],
    references: [users.id],
  }),
  nodes: many(nodes),
  connections: many(connections),
}));

export const nodeRelations = relations(nodes, ({ one, many }) => ({
  map: one(maps, {
    fields: [nodes.mapId],
    references: [maps.id],
  }),
  sourceConnections: many(connections, { relationName: "sourceNode" }),
  targetConnections: many(connections, { relationName: "targetNode" }),
}));

export const connectionRelations = relations(connections, ({ one }) => ({
  map: one(maps, {
    fields: [connections.mapId],
    references: [maps.id],
  }),
  sourceNode: one(nodes, {
    fields: [connections.sourceNodeId],
    references: [nodes.id],
    relationName: "sourceNode",
  }),
  targetNode: one(nodes, {
    fields: [connections.targetNodeId],
    references: [nodes.id],
    relationName: "targetNode",
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertMapSchema = createInsertSchema(maps).pick({
  title: true,
});

export const insertNodeSchema = createInsertSchema(nodes).pick({
  mapId: true,
  text: true,
  x: true,
  y: true,
  width: true,
  height: true,
  shape: true,
  color: true,
  textColor: true,
});

export const insertConnectionSchema = createInsertSchema(connections).pick({
  mapId: true,
  sourceNodeId: true,
  targetNodeId: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Map = typeof maps.$inferSelect;
export type InsertMap = z.infer<typeof insertMapSchema>;
export type Node = typeof nodes.$inferSelect;
export type InsertNode = z.infer<typeof insertNodeSchema>;
export type Connection = typeof connections.$inferSelect;
export type InsertConnection = z.infer<typeof insertConnectionSchema>;

export type MapWithNodes = Map & {
  nodes: Node[];
  connections: Connection[];
};
