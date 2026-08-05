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

export interface SnapEmbedOptions extends SnapOptions {
  embedId: string;
}

declare global {
  interface Window {
    snap?: {
      pay: (snapToken: string, options: SnapOptions) => void;
      embed: (snapToken: string, options: SnapEmbedOptions) => void;
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

export function openSnap(snapToken: string, options: SnapOptions = {}): void {
  if (!window.snap) {
    throw new Error("Midtrans Snap is not loaded yet");
  }
  window.snap.pay(snapToken, options);
}

export function openSnapEmbed(
  snapToken: string,
  embedId: string,
  options: Omit<SnapEmbedOptions, "embedId"> = {},
): void {
  if (!window.snap) {
    throw new Error("Midtrans Snap is not loaded yet");
  }
  const container = document.getElementById(embedId);
  if (!container) {
    throw new Error(`Snap embed container #${embedId} not found`);
  }
  container.innerHTML = "";
  window.snap.embed(snapToken, { embedId, ...options });
}
