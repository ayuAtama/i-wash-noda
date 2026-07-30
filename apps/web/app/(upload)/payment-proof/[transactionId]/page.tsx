// app/(upload)/payment-proof/[transactionId]/page.tsx

import PaymentProofUploader from "../../(components)/page";

export default async function UploadProofPage({
  params,
}: {
  params: Promise<{ transactionId: string }>;
}) {
  // Await the params Promise before extracting the value
  const { transactionId } = await params;

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">
        Upload Proof for Transaction: {transactionId}
      </h1>

      {/* Pass the extracted URL parameter into your client component */}
      <PaymentProofUploader transactionId={transactionId} />
    </main>
  );
}
