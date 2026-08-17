import { AlertCircle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  if (!message) return null;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="flex-1">{message}</p>
      {onRetry ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRetry}
          className="text-destructive"
        >
          <RotateCw className="mr-1 h-3.5 w-3.5" />
          Coba lagi
        </Button>
      ) : null}
    </div>
  );
}
