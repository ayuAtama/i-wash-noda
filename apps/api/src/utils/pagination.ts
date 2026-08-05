import type { PaginationDTO } from "@/validations/pagination.validation";

export function paginateArgs(page: number, limit: number) {
  return { skip: (page - 1) * limit, take: limit };
}

export async function paginate<T>(
  findMany: Promise<T[]>,
  count: Promise<number>,
  page: number,
  limit: number,
): Promise<{
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}> {
  const [data, total] = await Promise.all([findMany, count]);
  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
