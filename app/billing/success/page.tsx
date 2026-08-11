import type { Metadata } from "next";
import { BillingSuccessClient } from "@/components/BillingSuccessClient";

export const metadata: Metadata = {
  title: "Payment success — Matcha Filter",
  robots: { index: false, follow: false },
};

export default function BillingSuccessPage() {
  return (
    <article className="prose">
      <h1>Payment received</h1>
      <BillingSuccessClient />
    </article>
  );
}
