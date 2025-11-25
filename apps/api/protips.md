# Pro Tips for Using Prisma with pnpm

## 1. Add a Prisma Script in `package.json`

After installing Prisma, you can add custom scripts to streamline your workflow in package.json. For example, to ensure that the Prisma Client is generated after running migrations, you can add the following script:

```json
{
  "scripts": {
    "prisma:dev": "pnpm prisma migrate dev && pnpm prisma generate"
  }
}
```

> Note:
> Running `pnpm prisma migrate dev` will automatically trigger `pnpm prisma generate` as documented so this kinda useless.

---

## 2. Configure Seeding in `prisma.config.ts`

If you want to use Prisma’s seeding feature, move the configuration from `package.json` into `prisma.config.ts`:

```typescript
export default defineConfig({
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
});
```

---

## 3. Create or Use a Separate Local PostgreSQL Instance (UNRIABLE/OFTEN CRASHES AFTER MIGRATION)

To spin up a local PostgreSQL server instance and open Prisma Studio simultaneously, you can use:

```bash
pnpm prisma dev --name local_app
```

You can also run Prisma Studio or manage your database through the official Prisma VS Code extension.

---

## 4. Troubleshooting Tip: Type Errors After Migration

If you encounter type-related errors after running:

```bash
pnpm prisma migrate dev
```

Run the following command to regenerate the Prisma Client with updated types from `schema.prisma`:

```bash
pnpm prisma generate
```

This ensures your Prisma Client is synced with the latest schema changes.

---

better-auth Prisma Adapter Integration

---

To integrate better-auth with Prisma, you need to
make a prisma schema for better-auth by running:

```bash
pnpm dlx @better-auth/cli generate
```
