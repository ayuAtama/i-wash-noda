import { BrandLogo } from "@/components/shared/BrandLogo";
import { cn } from "@/lib/utils";

export function AuthShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-teal-50 to-background px-4 py-10">
      <div
        className={cn(
          "w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8",
          className,
        )}
      >
        <div className="mb-6 flex justify-center">
          <BrandLogo size={56} />
        </div>
        {children}
      </div>
    </main>
  );
}
