"use client";

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { EmptyState } from "./EmptyState";

export interface DataColumn<T> {
  key: string;
  header: ReactNode;
  render?: (item: T) => ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns,
  items,
  rowKey,
  onRowClick,
  loading,
  emptyTitle = "Belum ada data",
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  className,
}: {
  columns: DataColumn<T>[];
  items: T[];
  rowKey: (item: T) => string;
  onRowClick?: (item: T) => void;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  className?: string;
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    );
  }

  return (
    <div className={cn("overflow-x-auto rounded-xl border border-border", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key} className={col.className}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow
              key={rowKey(item)}
              className={cn(onRowClick && "cursor-pointer")}
              onClick={onRowClick ? () => onRowClick(item) : undefined}
            >
              {columns.map((col) => (
                <TableCell key={col.key} className={col.className}>
                  {col.render ? col.render(item) : null}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
