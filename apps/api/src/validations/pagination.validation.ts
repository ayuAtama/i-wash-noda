import { z } from "zod";
import "zod-openapi";

export const PaginationSchema = z
  .object({
    page: z.coerce.number().min(1).default(1).meta({
      description: "Page number",
      example: 1,
    }),
    limit: z.coerce.number().min(1).max(100).default(10).meta({
      description: "Items per page",
      example: 10,
    }),
  })
  .meta({
    id: "Pagination",
    description: "Query parameters for pagination",
  });

export type PaginationDTO = z.infer<typeof PaginationSchema>;

export function paginatedMeta(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
