import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertMapSchema, insertNodeSchema, insertConnectionSchema } from "@shared/schema";

function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Maps routes
  app.get("/api/maps", requireAuth, async (req, res, next) => {
    try {
      const maps = await storage.getMaps(req.user.id);
      res.json(maps);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/maps/:id", requireAuth, async (req, res, next) => {
    try {
      const map = await storage.getMap(req.params.id, req.user.id);
      if (!map) {
        return res.status(404).json({ message: "Map not found" });
      }
      res.json(map);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/maps", requireAuth, async (req, res, next) => {
    try {
      const data = insertMapSchema.parse(req.body);
      const map = await storage.createMap({ ...data, userId: req.user.id });
      res.status(201).json(map);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/maps/:id", requireAuth, async (req, res, next) => {
    try {
      const data = insertMapSchema.partial().parse(req.body);
      const map = await storage.updateMap(req.params.id, req.user.id, data);
      if (!map) {
        return res.status(404).json({ message: "Map not found" });
      }
      res.json(map);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/maps/:id", requireAuth, async (req, res, next) => {
    try {
      const success = await storage.deleteMap(req.params.id, req.user.id);
      if (!success) {
        return res.status(404).json({ message: "Map not found" });
      }
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // Nodes routes
  app.post("/api/nodes", requireAuth, async (req, res, next) => {
    try {
      const data = insertNodeSchema.parse(req.body);
      const node = await storage.createNode(data);
      res.status(201).json(node);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/nodes/:id", requireAuth, async (req, res, next) => {
    try {
      const data = insertNodeSchema.partial().parse(req.body);
      const node = await storage.updateNode(req.params.id, data);
      if (!node) {
        return res.status(404).json({ message: "Node not found" });
      }
      res.json(node);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/nodes/:id", requireAuth, async (req, res, next) => {
    try {
      const success = await storage.deleteNode(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Node not found" });
      }
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // Connections routes
  app.post("/api/connections", requireAuth, async (req, res, next) => {
    try {
      const data = insertConnectionSchema.parse(req.body);
      const connection = await storage.createConnection(data);
      res.status(201).json(connection);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/connections/:id", requireAuth, async (req, res, next) => {
    try {
      const success = await storage.deleteConnection(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Connection not found" });
      }
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // Search routes
  app.get("/api/search", requireAuth, async (req, res, next) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }
      const maps = await storage.searchMaps(req.user.id, query);
      res.json(maps);
    } catch (error) {
      next(error);
    }
  });

  // Export route
  app.get("/api/maps/:id/export", requireAuth, async (req, res, next) => {
    try {
      const map = await storage.getMap(req.params.id, req.user.id);
      if (!map) {
        return res.status(404).json({ message: "Map not found" });
      }
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${map.title}.json"`);
      res.json(map);
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
