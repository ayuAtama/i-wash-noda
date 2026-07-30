# Express.js OOP Architecture Guide

## Overview

This API follows a **4-layer OOP architecture** with constructor dependency injection (DI):

```
Server (composition root)
  └── App (Express setup)
        └── RouteRegistry (route collection)
              └── Route classes (HTTP routing)
                    └── Controller classes (request/response handling)
                          └── Service classes (business logic)
                                └── Prisma (database access via DI)
```

Every layer receives its dependencies through constructor injection. No layer hard-codes its dependencies — everything can be swapped, mocked, or tested in isolation.

---

## Layer 1: Entry Points

### `server.ts` — `Server` class (local dev)

The **composition root**. This is the only file that knows about every route, controller, and service. It wires everything together.

```ts
export class Server {
  private app: App;

  constructor() {
    // Build the route registry with all 17 routes
    const registry = new RouteRegistry()
      .register("/api/auth", authRoutes)
      .register("/api/addresses", AddressRoute);
    // ... 15 more routes

    // Pass the registry to App
    this.app = new App(registry);
  }

  public start(port: number): void {
    this.app.listen(port);
  }

  public getApp() {
    return this.app.app;
  }
}

// Auto-start only when run directly (not when imported by index.ts)
const isMainModule =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMainModule) {
  const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
  const server = new Server();
  server.start(PORT);
}
```

**Key points:**

- Only file that imports all route modules
- Uses `RouteRegistry.register()` fluent API to build route config
- Creates `App` with the registry
- Auto-starts only when executed directly (`tsx src/server.ts`), not when imported

### `index.ts` — Vercel serverless entry

```ts
import { Server } from "./server";

const server = new Server();
export default server.getApp(); // exports Express app, does NOT start server
```

**Key points:**

- Imports `Server` class (which builds the registry and creates `App`)
- Exports the raw Express `Application` for Vercel's serverless handler
- Does NOT call `server.start()` — Vercel manages the HTTP server

---

## Layer 2: App Setup

### `app.ts` — `App` class

The Express application wrapper. Knows about **middleware** and **routes** (as abstract `RouteConfig[]`), but NOT about specific route implementations.

```ts
export class App {
  public app: Application;

  constructor(registry: RouteRegistry) {
    this.app = express();
    this.initializeHealthCheck();
    this.initializeCors();
    this.initializeMiddlewares();
    this.initializeRoutes(registry.getAll()); // ← DI: receives routes from registry
    this.initializeSwagger();
    this.initializeErrorHandler();
  }

  private initializeRoutes(routes: { path: string; router: Router }[]) {
    routes.forEach(({ path, router }) => {
      this.app.use(path, router);
    });
  }

  public listen(port: number) {
    this.app.listen(port, () => {
      /* ... */
    });
  }
}
```

**Key points:**

- Receives `RouteRegistry` via constructor (not hard-coded imports)
- Has zero knowledge of which routes exist — just mounts them all
- Infrastructure concerns only: CORS, Helmet, JSON parsing, Swagger, error handler
- `public app` exposes the Express instance for serverless export

---

## Layer 3: Route Collection

### `routes/index.ts` — `RouteRegistry` class

A generic, reusable route collection. Has **zero knowledge** of specific routes.

```ts
export interface RouteConfig {
  path: string;
  router: Router;
}

export class RouteRegistry {
  private routes: RouteConfig[] = [];

  register(path: string, router: Router): this {
    this.routes.push({ path, router });
    return this; // fluent API: allows chaining
  }

  getAll(): RouteConfig[] {
    return [...this.routes]; // returns a copy, not a reference
  }
}
```

**Key points:**

- Pure data structure — no Express setup, no business logic
- Fluent `register()` returns `this` for chaining
- `getAll()` returns a defensive copy
- Completely generic — can be reused in any Express project

---

## Layer 4: Route Classes

Each route file defines a class that registers HTTP endpoints and wires middleware.

### Example: `routes/address.routes.ts`

```ts
export class AddressRoute {
  public router = Router();
  private controller: AddressController;

  constructor(controller: AddressController) {
    // ← DI: receives controller
    this.controller = controller;
    this.getAddress(); // register routes in constructor
    this.createAddress();
    this.updateAddress();
    this.deleteAddress();
    this.setDefaultAddress();
  }

  private createAddress() {
    this.router.post(
      "/",
      authenticationMiddleware, // auth middleware
      Validator.validate({
        // Zod validation
        body: AddressValidation.CreateAddressSchema,
      }),
      this.controller.create, // controller method (bound)
    );
  }

  private deleteAddress() {
    this.router.delete(
      "/:id",
      authenticationMiddleware,
      Validator.validate({
        params: AddressValidation.ParamsAddressSchema,
      }),
      this.controller.delete,
    );
  }
  // ... more route registration methods
}

// Self-wiring: creates the full dependency chain and exports the router
export default new AddressRoute(new AddressController(new AddressService()))
  .router;
```

**Key points:**

- Constructor receives `AddressController` via DI
- Private methods register routes in the constructor
- Route handlers are `this.controller.methodName` — bound in controller constructor
- Default export creates the full chain: `Service → Controller → Route → router`

### Multi-class route files

Some files export two route classes that share a controller:

```ts
// routes/adminOrder.routes.ts
export class AdminOrderRoute {
  /* ... */
}
export class AdminWalkInOrderRoute {
  /* ... */
}

// Shared controller instance — both classes get the same one
const controller = new AdminOrderController(new AdminOrderService());
export const adminWalkInOrderRoutes = new AdminWalkInOrderRoute(controller)
  .router;
export default new AdminOrderRoute(controller).router;
```

---

## Layer 5: Controller Classes

Controllers handle HTTP request/response. They know about **one service** and nothing else.

### Example: `controllers/addresses.controller.ts`

```ts
export class AddressController {
  private addressService: AddressService; // injected via constructor

  constructor(addressService: AddressService) {
    this.addressService = addressService; // ← DI
  }

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.access_token?.sub ?? req.user?.id;
      if (!userId) throw new HttpError(401, "Invalid user id");

      const addresses = await this.addressService.getAll(userId); // ← calls service

      res.status(200).json({
        success: true,
        message: "Addresses fetched successfully",
        data: addresses,
      });
    } catch (err) {
      next(err); // pass errors to error handler
    }
  };
  // ... more methods
}
```

**Key points:**

- Constructor receives service via DI
- Using arrow functions is **required** because Express calls methods as detached callbacks
- Extracts validated data from `req.validated` (set by `Validator` middleware)
- Extracts user ID from `req.access_token` (set by `authenticationMiddleware`)
- Calls service methods, formats response, passes errors to `next()`
- Never touches database directly — always through `this.service.method()`

---

## Layer 6: Service Classes

Services contain business logic and database access. They know about **Prisma** (via DI) and nothing else.

### Example: `services/addresses.services.ts`

```ts
import { prisma, PrismaWrapper } from "@/config/prisma";

export class AddressService {
  private readonly prisma: PriwsmaWrapper; // typed Prisma client

  constructor(prismaClient: PrismaWrapper = prisma) {
    this.prisma = prismaClient; // ← DI with default
  }

  async getAll(userId: UserIdDto) {
    try {
      const addresses = await this.prisma.userAddress.findMany({
        where: { user_id: userId, is_deleted: false },
        orderBy: { created_at: "desc" },
      });
      return { totalAddresses: addresses.length, addresses };
    } catch (error) {
      throw error;
    }
  }

  async create(userId: UserIdDto, data: CreateAddressDto) {
    try {
      const { newAddress } = await this.prisma.$transaction(async (tx) => {
        const addressCount = await tx.userAddress.count({
          where: { user_id: userId },
        });
        const finalIsDefault =
          addressCount === 0 ? true : Boolean(data.isDefault);

        if (finalIsDefault) {
          await tx.userAddress.updateMany({
            where: { user_id: userId, is_default: true },
            data: { is_default: false },
          });
        }

        const newAddress = await tx.userAddress.create({
          data: { user_id: userId, ...data, is_default: finalIsDefault },
        });
        return { newAddress };
      });
      return newAddress;
    } catch (error) {
      throw error;
    }
  }
  // ... more methods
}
```

**Key points:**

- Receives Prisma client via constructor DI (with default fallback)
- All DB access through `this.prisma.xxx` (never bare `prisma.xxx`)
- Uses Zod DTOs for input typing (`CreateAddressDto`, etc.)
- Uses `this.prisma.$transaction()` for multi-step DB operations
- Throws `HttpError` for business logic errors
- No knowledge of HTTP — just receives data, processes it, returns results

---

## Full Request Flow Example

```
HTTP Request: POST /api/addresses
  │
  ├─ Express matches "/api/addresses" prefix
  │    └─ AddressRoute.router handles the request
  │
  ├─ authenticationMiddleware
  │    └─ Verifies JWT → sets req.access_token
  │
  ├─ Validator.validate({ body: CreateAddressSchema })
  │    └─ Zod validates body → sets req.validated.body
  │
  ├─ AddressController.create(req, res, next)
  │    ├─ Extracts userId from req.access_token
  │    ├─ Extracts payload from req.validated.body
  │    └─ Calls this.addressService.create(userId, payload)
  │
  ├─ AddressService.create(userId, payload)
  │    ├─ this.prisma.$transaction(async (tx) => { ... })
  │    │    ├─ tx.userAddress.count(...)
  │    │    ├─ tx.userAddress.updateMany(...)
  │    │    └─ tx.userAddress.create(...)
  │    └─ Returns created address
  │
  └─ AddressController sends JSON response
       └─ { success: true, data: createdAddress }
```

---

## Dependency Injection Chain

```
Route file (self-wiring):
  new AddressRoute(              ← receives AddressController
    new AddressController(       ← receives AddressService
      new AddressService()       ← receives default prisma from config/prisma.ts
    )
  ).router

Server (composition root):
  new RouteRegistry()
    .register("/api/addresses", AddressRoute.router)
    → App receives registry
      → App mounts router at "/api/addresses"
```

---

## Config: Prisma Client

### `config/prisma.ts`

```ts
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export { prisma };
```

This is the **only place** Prisma is instantiated. Services receive it via DI:

```ts
import { prisma as defaultPrisma } from "@/config/prisma";
type PrismaInstance = typeof defaultPrisma;

export class SomeService {
  private readonly prisma: PrismaInstance;
  constructor(prismaClient: PrismaInstance = defaultPrisma) {
    this.prisma = prismaClient;
  }
}
```

The default parameter (`= defaultPrisma`) means:

- Production: no argument passed, uses real Prisma
- Testing: pass a mock Prisma client for unit tests

---

## Validation: Zod DTOs

### `validations/address.validation.ts`

```ts
export class AddressValidation {
  static CreateAddressSchema = z.object({
    label: z.string().min(1),
    address: z.string().min(1),
    lat: z.string(),
    lng: z.string(),
    isDefault: z.boolean().optional(),
  });

  static ParamsAddressSchema = z.object({
    id: z.string().uuid(),
  });
}

export type CreateAddressDto = z.infer<
  typeof AddressValidation.CreateAddressSchema
>;
export type ParamsAddressDto = z.infer<
  typeof AddressValidation.ParamsAddressSchema
>;
```

**Usage:**

- Route files: `Validator.validate({ body: AddressValidation.CreateAddressSchema })`
- Controller files: `req.validated!.body as CreateAddressDto`
- Service files: method parameters use DTO types

---

## Error Handling

### Custom `HttpError`

```ts
throw new HttpError(404, "Address not found");
throw new HttpError(400, "Outlet is not within coverage");
```

### Error flow

```
Service throws HttpError(404, "Not found")
  → Controller catch block: next(error)
    → Express error handler middleware
      → Formats JSON error response
```

---

## Testing Pattern

Thanks to constructor DI, every class is testable in isolation:

```ts
// Test AddressService with mock Prisma
const mockPrisma = {
  userAddress: {
    findMany: jest.fn().mockResolvedValue([...]),
    create: jest.fn().mockResolvedValue({...}),
  },
};
const service = new AddressService(mockPrisma as any);
const result = await service.getAll("user-123");
expect(mockPrisma.userAddress.findMany).toHaveBeenCalled();

// Test AddressController with mock Service
const mockService = { getAll: jest.fn().mockResolvedValue({...}) };
const controller = new AddressController(mockService as any);
// Call controller method, verify it calls mockService
```

---

## File Structure

```
src/
├── index.ts              → Vercel entry (exports app)
├── server.ts             → Server class (composition root, local dev entry)
├── app.ts                → App class (Express setup, accepts RouteRegistry)
├── config/
│   └── prisma.ts         → Prisma client singleton
├── routes/
│   ├── index.ts          → RouteRegistry class + RouteConfig interface
│   ├── address.routes.ts → AddressRoute class
│   ├── admin.routes.ts   → AdminRoute class
│   └── ...               → 14 more route files
├── controllers/
│   ├── addresses.controller.ts → AddressController class
│   ├── admin.controller.ts     → AdminController class
│   └── ...                     → 14 more controller files
├── services/
│   ├── addresses.services.ts   → AddressService class
│   ├── admin.services.ts       → AdminService class
│   └── ...                     → 13 more service files
├── validations/
│   ├── address.validation.ts   → Zod schemas + DTO types
│   └── ...                     → more validation files
├── middleware/
│   ├── authentication.ts       → JWT auth middleware
│   ├── authorization.ts        → Role-based access
│   ├── validate.ts             → Zod validation middleware
│   └── ...
└── utils/
    ├── httpError.ts            → Custom HttpError class
    └── ...
```

---

## OOP Principles Used

| Principle                        | Where                                                                                           |
| -------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Encapsulation**                | Private fields in all classes, private route registration methods                               |
| **Dependency Injection**         | Constructor injection at every layer (Service → Controller → Route → App)                       |
| **Single Responsibility**        | Services = business logic, Controllers = HTTP handling, Routes = URL routing                    |
| **Open/Closed**                  | `RouteRegistry` accepts any route without modification; add new routes by calling `.register()` |
| **Fluent Interface**             | `RouteRegistry.register()` returns `this` for method chaining                                   |
| **Default Parameters**           | Services accept Prisma with default fallback for easy testing                                   |
| **Composition over Inheritance** | `Server` composes `App` + `RouteRegistry`; no class inheritance anywhere                        |
