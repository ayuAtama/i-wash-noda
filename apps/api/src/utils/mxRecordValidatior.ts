// /apps/api/src/utils/mxRecordValidation.ts
import dns from "dns/promises";

export async function validateMXRecord(domain: string): Promise<boolean> {
  try {
    const onlyDomain = domain.split("@")[1];
    const mxRecords = await dns.resolveMx(onlyDomain);

    // Reject if empty array
    if (!mxRecords.length) return false;

    // Reject invalid MX entries
    const hasValidRecord = mxRecords.some(
      (mx) =>
        typeof mx.exchange === "string" &&
        mx.exchange.trim() !== "" &&
        typeof mx.priority === "number"
    );

    return hasValidRecord;
  } catch (error) {
    return false;
  }
}
