import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "@/lib/utils";

function slugify(value: string) {
  return value.toLowerCase().replace(/\s+/g, "-");
}

function Input({
  className,
  type,
  label,
  error,
  hint,
  id,
  ...props
}: React.ComponentProps<"input"> & {
  label?: string;
  error?: string;
  hint?: string;
}) {
  const inputId = id || (label ? slugify(label) : undefined);
  const input = (
    <InputPrimitive
      id={inputId}
      type={type}
      aria-invalid={error ? true : undefined}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    />
  );

  if (!label && !error && !hint) return input;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          {label}
        </label>
      )}
      {input}
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
      {hint && !error && (
        <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

export { Input };
