import { Check, type LucideIcon } from "lucide-react";
import { ORDER_STATUS_LABEL, ORDER_STATUS_ORDER } from "@/lib/utils";
import { cn } from "@/lib/utils";

function StepDot({
  done,
  active,
  icon: Icon,
}: {
  done: boolean;
  active: boolean;
  icon?: LucideIcon;
}) {
  return (
    <div
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
        done && "border-primary bg-primary text-primary-foreground",
        active && "border-primary text-primary",
        !done && !active && "border-muted-foreground/30 text-muted-foreground",
      )}
    >
      {done ? <Check className="h-4 w-4" /> : Icon ? <Icon className="h-4 w-4" /> : null}
    </div>
  );
}

export function StatusStepper({
  currentStatus,
  icons,
}: {
  currentStatus: string;
  icons?: Record<string, LucideIcon>;
}) {
  const index = ORDER_STATUS_ORDER.indexOf(currentStatus);

  return (
    <ol className="flex flex-col gap-4">
      {ORDER_STATUS_ORDER.map((status, i) => {
        const done = index > i;
        const active = index === i;

        return (
          <li key={status} className="flex gap-3">
            <div className="flex flex-col items-center">
              <StepDot
                done={done}
                active={active}
                icon={icons?.[status]}
              />
              {i < ORDER_STATUS_ORDER.length - 1 ? (
                <div
                  className={cn(
                    "w-0.5 flex-1",
                    index > i ? "bg-primary" : "bg-muted-foreground/30",
                  )}
                />
              ) : null}
            </div>
            <div className="pb-4">
              <p
                className={cn(
                  "text-sm font-medium",
                  active && "text-primary",
                  done && "text-foreground",
                  !done && !active && "text-muted-foreground",
                )}
              >
                {ORDER_STATUS_LABEL[status] ?? status}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
