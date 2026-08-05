export interface SnapPaymentResult {
  transaction_id?: string;
  order_id?: string;
  payment_type?: string;
  status_code?: string;
  fraud_status?: string;
}

export interface SnapOptions {
  onSuccess?: (result: SnapPaymentResult) => void;
  onPending?: (result: SnapPaymentResult) => void;
  onError?: (result: SnapPaymentResult) => void;
  onClose?: () => void;
}

declare global {
  interface Window {
    snap?: {
      pay: (snapToken: string, options: SnapOptions) => void;
    };
  }
}

function snapScriptUrl(): string {
  const isProduction =
    process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";
  return isProduction
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";
}

export function loadSnapScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return resolve();

    if (window.snap) return resolve();

    const existing = document.getElementById("midtrans-snap-script");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      return;
    }

    const script = document.createElement("script");
    script.id = "midtrans-snap-script";
    script.src = snapScriptUrl();
    script.async = true;
    script.setAttribute(
      "data-client-key",
      process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "",
    );
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Midtrans Snap"));
    document.head.appendChild(script);
  });
}

export function openSnap(
  snapToken: string,
  options: SnapOptions = {},
): void {
  if (!window.snap) {
    throw new Error("Midtrans Snap is not loaded yet");
  }
  window.snap.pay(snapToken, options);
}
