export default function createPagination({
  page,
  limit,
  total,
}: {
  page: number;
  limit: number;
  total: number;
}) {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages: totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
    nextPage: page + 1,
    previousPage: page - 1,
  };
}
