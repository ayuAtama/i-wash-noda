import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function StepIndicator({
  steps,
  current,
}: {
  steps: readonly string[];
  current: number;
}) {
  return (
    <ol className="flex w-full items-center justify-center gap-2">
      {steps.map((label, index) => {
        const stepNumber = index + 1;
        const isDone = stepNumber < current;
        const isActive = stepNumber === current;

        return (
          <li
            key={label}
            className="flex flex-1 items-center gap-2 last:flex-none"
          >
            <div className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                  isDone && "border-primary bg-primary text-primary-foreground",
                  isActive && "border-primary text-primary",
                  !isDone && !isActive && "border-muted-foreground/30 text-muted-foreground",
                )}
              >
                {isDone ? <Check className="h-4 w-4" /> : stepNumber}
              </span>
              <span
                className={cn(
                  "text-xs",
                  isActive ? "font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </div>
            {index < steps.length - 1 ? (
              <div
                className={cn(
                  "h-0.5 flex-1",
                  stepNumber < current ? "bg-primary" : "bg-muted-foreground/30",
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
