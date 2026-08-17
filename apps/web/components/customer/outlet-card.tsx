"use client";

import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Outlet } from "@/lib/api/types";
import { formatDistance, formatIDR } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type CoveredOutlet = Outlet & { distance_km?: number };

export function OutletCard({
  outlet,
  selected,
  onSelect,
  selectLabel = "Pilih",
}: {
  outlet: CoveredOutlet;
  selected?: boolean;
  onSelect?: () => void;
  selectLabel?: string;
}) {
  return (
    <Card
      className={cn(
        "transition-colors",
        selected && "border-primary ring-1 ring-primary",
      )}
    >
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{outlet.name}</p>
            {outlet.distance_km !== undefined ? (
              <Badge variant="secondary">{formatDistance(outlet.distance_km)}</Badge>
            ) : null}
          </div>
          <p className="flex items-start gap-1 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-2">{outlet.address}</span>
          </p>
          <p className="text-sm">
            <span className="font-medium text-foreground">
              {formatIDR(outlet.price_per_kg)}
            </span>
            <span className="text-muted-foreground"> /kg</span>
            <span className="mx-2 text-muted-foreground">•</span>
            <span className="font-medium text-foreground">
              {formatIDR(outlet.price_per_km)}
            </span>
            <span className="text-muted-foreground"> /km</span>
          </p>
        </div>
        {onSelect ? (
          <Button
            size="sm"
            variant={selected ? "default" : "outline"}
            onClick={onSelect}
            className="shrink-0"
          >
            {selected ? "Dipilih" : selectLabel}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function OutletCardSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>
  );
}
