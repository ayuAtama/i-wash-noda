// src/routes/index.ts
import { Router } from "express";

export interface RouteConfig {
  path: string;
  router: Router;
}

export class RouteRegistry {
  private routes: RouteConfig[] = [];

  register(path: string, router: Router): this {
    this.routes.push({ path, router });
    return this;
  }

  getAll(): RouteConfig[] {
    return [...this.routes];
  }
}
