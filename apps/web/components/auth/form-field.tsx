"use client";

import type { InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FieldLike {
  name: string;
  state: {
    value: string;
    meta: { errors: unknown[] };
  };
  handleBlur: () => void;
  handleChange: (value: string) => void;
}

function errorText(error: unknown): string {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "";
}

export function FieldError({ errors }: { errors: unknown[] }) {
  const message = errors.map(errorText).filter(Boolean).join(", ");
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

export function FieldInput({
  field,
  label,
  type = "text",
  placeholder,
  autoComplete,
  disabled,
}: {
  field: FieldLike;
  label: string;
  type?: InputHTMLAttributes<HTMLInputElement>["type"];
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={field.name}>{label}</Label>
      <Input
        id={field.name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      <FieldError errors={field.state.meta.errors} />
    </div>
  );
}
