import { Loader2 } from "lucide-react";

export function BrandLogo({ size = 48 }: { size?: number }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold"
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        IW
      </div>
      <p className="text-2xl font-bold tracking-tight text-foreground">
        I-Wash <span className="text-primary">Noda</span>
      </p>
    </div>
  );
}

export function FullScreenLoader({ label = "Memuat…" }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
